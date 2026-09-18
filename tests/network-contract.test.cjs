const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test, describe } = require('node:test');
const ts = require('typescript');
const { ROOT, SRC } = require('./support/load-ts.cjs');
const { ROUTES } = require('./support/front-app.cjs');
const { OpenApiContract } = require('./support/openapi-contract.ts');
const { loadOrvalContract, resolveOrvalPackage } = require('./support/orval-contract.ts');

// Analyse statique des sources. Un front ne consomme qu'un BFF (BFF_Dashboard) et qu'un contrat : le paquet
// publié @mairie360/bff-dashboard-openapi en version X.X.X, dont contracts/openapi.json est la reconstruction :
// - navigateur → front : `requestBff(<chemin littéral>, { method })` doit exister dans le contrat ;
// - serveur → BFF : le seul route handler est le proxy catch-all, qui ne relaie que vers BFF_Dashboard ;
// - `fetch` n'est appelé que par ces deux points d'entrée, et aucune autre API réseau n'est utilisée.
// Les tests avec mock serveurs (tests/bff.mock-servers.test.cjs) vérifient le même périmètre à l'exécution.

const dashboardContract = OpenApiContract.load(path.join(ROOT, 'contracts', 'openapi.json'));
const CONTRACT_PACKAGE = '@mairie360/bff-dashboard-openapi';
const FETCH_OWNERS = ['lib/bff-client.ts', 'lib/bff-proxy.ts'];
const FORBIDDEN_NETWORK_APIS = ['XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon', 'axios'];

function sourceFiles(dir = SRC) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [file] : [];
  });
}

const sources = sourceFiles().map((file) => ({
  file: path.relative(SRC, file).split(path.sep).join('/'),
  ast: ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS),
}));

function calls(ast, name) {
  const found = [];
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const calleeName = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : undefined;
      if (calleeName === name) found.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return found;
}

function literal(node) {
  return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
}

function where(ast, node) {
  const { line } = ast.getLineAndCharacterOfPosition(node.getStart());
  return `${path.relative(SRC, ast.fileName)}:${line + 1}`;
}

/** Méthode HTTP d'un appel `requestBff(path, { method })` : GET par défaut, littérale sinon. */
function requestMethod(init) {
  if (!init) return 'GET';
  if (!ts.isObjectLiteralExpression(init)) return undefined;
  const property = init.properties.find((candidate) => ts.isPropertyAssignment(candidate) && candidate.name.getText() === 'method');
  if (!property) return init.properties.some(ts.isSpreadAssignment) ? undefined : 'GET';
  return literal(property.initializer)?.toUpperCase();
}

const browserCalls = sources.flatMap(({ file, ast }) => (file === 'lib/bff-client.ts' ? [] : calls(ast, 'requestBff').map((node) => ({ ast, node }))));

describe('every network call of the front targets an operation of an OpenAPI contract', () => {
  test('the page actually loads its data through requestBff', () => {
    assert.ok(browserCalls.length > 0, 'aucun appel requestBff trouvé : le test ne vérifierait rien');
  });

  test('requestBff paths and methods are declared in contracts/openapi.json', () => {
    const problems = browserCalls.flatMap(({ ast, node }) => {
      const pathname = literal(node.arguments[0]);
      const method = requestMethod(node.arguments[1]);
      if (pathname === undefined || method === undefined) return [`${where(ast, node)} : chemin ou méthode non littéral, impossible à vérifier contre le contrat`];
      const url = new URL(pathname, 'http://front.test');
      if (url.search) return [`${where(ast, node)} : ${pathname} ajoute des paramètres de requête`];
      const { match, errors } = dashboardContract.validateRequest(method, url);
      return match ? errors.map((error) => `${where(ast, node)} : ${error}`) : [`${where(ast, node)} : ${method} ${pathname} absent de contracts/openapi.json`];
    });
    assert.deepEqual(problems, []);
  });

  test('fetch is only called by the same-origin client and the contract-gated proxy', () => {
    const owners = sources.filter(({ ast }) => calls(ast, 'fetch').length > 0).map(({ file }) => file).sort();
    assert.deepEqual(owners, FETCH_OWNERS);
  });

  test('no other network API is used', () => {
    const problems = sources.flatMap(({ file, ast }) => FORBIDDEN_NETWORK_APIS.filter((api) => new RegExp(`\\b${api}\\b`).test(ast.text)).map((api) => `${file} : ${api}`));
    assert.deepEqual(problems, []);
  });

  test('the client only builds same-origin requests', () => {
    const client = sources.find(({ file }) => file === 'lib/bff-client.ts');
    const [call] = calls(client.ast, 'fetch');
    assert.equal(call.arguments[0].getText(), 'path');
    assert.match(call.arguments[1].getText(), /credentials: 'same-origin'/);
  });
});

describe('coverage scope', () => {
  // La couverture de node:test ne compte que les fichiers chargés : chaque module TypeScript de src est
  // donc chargé ici (les composants .tsx, rendus par Next.js, restent hors périmètre).
  test('every TypeScript module of src loads outside Next.js', () => {
    const modules = sources.filter(({ file }) => file.endsWith('.ts'));
    assert.ok(modules.length > 0);
    for (const { file } of modules) assert.doesNotThrow(() => require(path.join(SRC, file)), file);
  });
});

describe('the proxy exposes exactly the contract', () => {
  const catchAll = ROUTES.find(({ segments }) => segments.join('/') === '[...path]');
  const exported = new Set(Object.keys(require(catchAll.file)));

  test('every operation of contracts/openapi.json is reachable through the catch-all route', () => {
    const unreachable = Object.entries(dashboardContract.document.paths).flatMap(([template, operations]) =>
      Object.keys(operations).map((method) => method.toUpperCase()).filter((method) => !exported.has(method)).map((method) => `${method} ${template}`));
    assert.deepEqual(unreachable, []);
  });

  test('no static route shadows a contract path', () => {
    const shadowed = ROUTES.filter(({ segments }) => !segments.some((segment) => segment.startsWith('[')))
      .map(({ segments }) => `/${segments.join('/')}`)
      .filter((pathname) => ['get', 'post', 'put', 'patch', 'delete'].some((method) => dashboardContract.match(method, pathname)));
    assert.deepEqual(shadowed, []);
  });

  test('the contract snapshot is the BFF_Dashboard contract', () => {
    assert.equal(dashboardContract.title, 'bff_dashboard');
    assert.deepEqual(Object.keys(dashboardContract.document.paths).sort(), ['/check_apis', '/dashboard/bootstrap', '/health']);
  });
});

describe('one front, one BFF, one OpenAPI contract', () => {
  test('contracts/ holds a single OpenAPI contract', () => {
    assert.deepEqual(fs.readdirSync(path.join(ROOT, 'contracts')), ['openapi.json']);
  });

  test('the contract-gated catch-all proxy is the only route handler', () => {
    assert.deepEqual(ROUTES.map(({ segments }) => `/${segments.join('/')}`), ['/[...path]']);
  });

  test('requests are only forwarded to the BFF_Dashboard URL', () => {
    const forwards = sources.flatMap(({ file, ast }) => calls(ast, 'forwardToBff').map((node) => `${file} ${node.arguments[1]?.getText()}`));
    assert.deepEqual(forwards, ['lib/bff-proxy.ts configuredBffUrl()']);
    const bffVariables = [...new Set(sources.flatMap(({ ast }) => [...ast.text.matchAll(/process\.env\.(\w*BFF\w*)/g)].map(([, name]) => name)))].sort();
    assert.deepEqual(bffVariables, ['BFF_DASHBOARD_BASE_URL', 'DASHBOARD_BFF_URL']);
  });

  test('the only OpenAPI package is the published BFF_Dashboard contract, pinned to X.X.X', () => {
    const { dependencies = {}, devDependencies = {} } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const all = { ...dependencies, ...devDependencies };
    assert.deepEqual(Object.keys(all).filter((name) => /openapi/i.test(name)), [CONTRACT_PACKAGE]);
    assert.match(all[CONTRACT_PACKAGE], /^\d+\.\d+\.\d+$/, 'version publiée exacte attendue, sans plage ni pré-version');
    assert.equal(resolveOrvalPackage(CONTRACT_PACKAGE).version, all[CONTRACT_PACKAGE]);
  });

  test('the security and performance stacks run the BFF_Dashboard image of the contract version', () => {
    const { version } = resolveOrvalPackage(CONTRACT_PACKAGE);
    for (const stack of ['docker-compose-security.yml', 'docker-compose-performance.yml']) {
      const images = [...fs.readFileSync(path.join(ROOT, stack), 'utf8').matchAll(/ghcr\.io\/mairie360\/bff-dashboard:([^\s}]+)/g)].map(([, tag]) => tag);
      assert.deepEqual(images, [version], stack);
    }
  });

  test('response types come from the published package, not from a local copy', () => {
    assert.equal(fs.existsSync(path.join(SRC, 'contracts')), false);
    const contractImports = sources.flatMap(({ file, ast }) => ast.statements.filter(ts.isImportDeclaration)
      .map((statement) => statement.moduleSpecifier.text).filter((specifier) => /contract|openapi/i.test(specifier)).map((specifier) => `${file} ${specifier}`));
    assert.deepEqual(contractImports, [`lib/bff-proxy.ts ../../contracts/openapi.json`, `lib/dashboard-view.ts ${CONTRACT_PACKAGE}/model`]);
  });

  test('contracts/openapi.json is the reconstruction of the installed published package', () => {
    const published = loadOrvalContract(CONTRACT_PACKAGE).document;
    const { version } = resolveOrvalPackage(CONTRACT_PACKAGE);
    assert.deepEqual(dashboardContract.document, { openapi: '3.1.0', info: { title: published.info.title, version }, paths: published.paths, components: published.components });
  });
});
