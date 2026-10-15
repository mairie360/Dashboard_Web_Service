const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const composePolicy = require('./support/compose-policy.cjs');
const { test, describe } = require('node:test');
const ts = require('typescript');
const policy = require('./support/source-policy.cjs');
const { ROOT, SRC } = require('./support/load-ts.cjs');
const { ROUTES } = require('./support/front-app.cjs');
const { OpenApiContract } = require('./support/openapi-contract.ts');
const { loadOrvalContract, resolveOrvalPackage } = require('./support/orval-contract.ts');

// Analyse statique des sources. Un front ne consomme qu'un BFF (BFF_Dashboard) et qu'un contrat : le paquet
// publié @mairie360/bff-dashboard-openapi en version X.X.X, dont contracts/openapi.json est la reconstruction :
// - navigateur → front : les fonctions générées du paquet (`bffDashboard.<opération>`) sont les seuls appels, sans chemin écrit à la main ;
// - serveur → BFF : le seul route handler est le proxy catch-all, qui ne relaie que vers BFF_Dashboard ;
// - `fetch` n'est appelé que par ces deux points d'entrée, et aucune autre API réseau n'est utilisée.
// Les tests avec mock serveurs (tests/bff.mock-servers.test.cjs) vérifient le même périmètre à l'exécution.

const dashboardContract = OpenApiContract.load(path.join(ROOT, 'contracts', 'openapi.json'));
const CONTRACT_PACKAGE = '@mairie360/bff-dashboard-openapi';
const FETCH_OWNERS = [];

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
  const property = init.properties.find((candidate) => ts.isPropertyAssignment(candidate) && policy.propertyName(candidate.name) === 'method');
  if (!property) return init.properties.some(ts.isSpreadAssignment) ? undefined : 'GET';
  return literal(property.initializer)?.toUpperCase();
}

const GENERATED = fs.readFileSync(path.join(ROOT, 'node_modules', CONTRACT_PACKAGE, 'endpoints', 'bffDashboard.ts'), 'utf8');
const GENERATED_OPERATIONS = new Set([...GENERATED.matchAll(/^const (\w+) = \(/gm)].map(([, name]) => name));
const browserCalls = sources.flatMap(({ file, ast }) => (file === 'lib/bff-client.ts' ? [] : policy.nodes(ast, (node) => ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.expression.getText() === 'bffDashboard').map((node) => ({ file, ast, node }))));

describe('every network call of the front targets an operation of an OpenAPI contract', () => {
  test('the page actually loads its data through the generated client', () => {
    assert.ok(browserCalls.length > 0, 'no bffDashboard call found: the test would verify nothing');
  });

  test('the access-only server relay performs only the published bootstrap read', () => {
    assert.deepEqual(browserCalls.filter(entry => entry.file === 'lib/server-dashboard.ts')
      .map(entry => entry.node.expression.name.text), ['getDashboardBootstrap']);
  });

  test('every called operation exists in the generated client and no path literal is written outside it', () => {
    assert.deepEqual(browserCalls.filter(({ node }) => !GENERATED_OPERATIONS.has(node.expression.name.text)).map(({ ast, node }) => where(ast, node)), []);
    const literals = sources.filter(({ file }) => !['lib/bff-client.ts', 'lib/bff-proxy.ts', 'middleware.ts'].includes(file))
      .flatMap(({ file, ast }) => policy.nodes(ast, (node) => ts.isStringLiteralLike(node) && /^\/(dashboard|me|health|check_apis)/.test(node.text)).map((node) => `${file}: ${node.text}`));
    assert.deepEqual(literals, []);
    assert.equal(sources.filter(({ ast }) => calls(ast, 'requestBff').length > 0 && ast.fileName.indexOf('bff-client') < 0).length, 0);
  });

  test('the shared session transport owns raw fetch', () => {
    const owners = sources.filter(({ ast }) => calls(ast, 'fetch').length > 0).map(({ file }) => file).sort();
    assert.deepEqual(owners, FETCH_OWNERS);
  });

  test('no other network API is used', () => {
    // axios only carries the generated operations through the fetch of the BFF client.
    const problems = sources.flatMap(({ file, ast }) => policy.networkReferences(ast).filter(api => file !== 'lib/bff-client.ts' || !/axios/.test(api)).map(api => `${file} : ${api}`));
    assert.deepEqual(problems, []);
  });

  test('the client only builds same-origin requests', () => {
    const client = sources.find(({ file }) => file === 'lib/bff-client.ts');
    assert.ok(policy.imports(client.ast).includes('@mairie360/front-kit/browser'));
    const [call] = calls(client.ast, 'sessionFetch');
    assert.ok(policy.parameterReference(call.arguments[0]));
    assert.ok(ts.isObjectLiteralExpression(call.arguments[1]));
    const credentials = call.arguments[1].properties.find(node => ts.isPropertyAssignment(node) && policy.propertyName(node.name) === 'credentials');
    assert.ok(credentials && ts.isStringLiteralLike(credentials.initializer));
    assert.equal(credentials.initializer.text, 'same-origin');
  });
});

describe('coverage scope', () => {
  // La couverture de node:test ne compte que les fichiers chargés : chaque module TypeScript de src est
  // donc chargé ici (les composants .tsx, rendus par Next.js, restent hors périmètre).
  test('every TypeScript module of src loads outside Next.js', t => {
    const Module = require('node:module');
    const originalLoad = Module._load;
    // Next owns the compile-time server-only marker; the real module is still loaded.
    Module._load = function(request, ...rest) {
      return request === 'server-only' ? {} : originalLoad.call(this, request, ...rest);
    };
    t.after(() => { Module._load = originalLoad; });
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

  test('the contract-gated proxy and two session entry points are the only route handlers', () => {
    assert.deepEqual(ROUTES.map(({ segments }) => `/${segments.join('/')}`).sort(), ['/[...path]', '/api/auth/refresh', '/api/auth/resume']);
  });

  test('requests are only forwarded to the BFF_Dashboard URL', () => {
    const forwards = sources.flatMap(({ file, ast }) => calls(ast, 'forwardToBff').map(node => ({ file, baseUrl: node.arguments[1] })));
    assert.deepEqual(forwards.map(row => row.file), ['lib/bff-proxy.ts', 'lib/server-dashboard.ts']);
    assert.ok(forwards.every(row => policy.configuredUrl(row.baseUrl)));
    const bffVariables = [...new Set(sources.flatMap(({ ast }) => policy.envNames(ast).filter(name => name?.includes('BFF'))))].sort();
    assert.deepEqual(bffVariables, ['BFF_DASHBOARD_BASE_URL', 'DASHBOARD_BFF_URL']);
  });

  test('the only OpenAPI package is the published BFF_Dashboard contract, pinned to an accepted exact version', async () => {
    const { isAcceptedContractVersion } = await import('../scripts/contract-version.mjs');
    const { dependencies = {}, devDependencies = {} } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const all = { ...dependencies, ...devDependencies };
    assert.deepEqual(Object.keys(all).filter((name) => /openapi/i.test(name)), [CONTRACT_PACKAGE]);
    // Release X.Y.Z or 0.0.0-dev.<sha40> of BFF_Dashboard main (scripts/contract-version.mjs), never staging.
    assert.ok(isAcceptedContractVersion(all[CONTRACT_PACKAGE]), 'version publiée exacte attendue (X.Y.Z ou 0.0.0-dev.<sha>), sans plage ni pré-version staging');
    assert.equal(resolveOrvalPackage(CONTRACT_PACKAGE).version, all[CONTRACT_PACKAGE]);
  });

  test('the security and performance stacks run the BFF_Dashboard image built from the contract package commit', async () => {
    const { imageTagForContractVersion } = await import('../scripts/contract-version.mjs');
    const { version } = resolveOrvalPackage(CONTRACT_PACKAGE);
    for (const stack of ['docker-compose-security.yml', 'docker-compose-performance.yml']) {
      const images = composePolicy.bffImages(composePolicy.compose(stack)).filter(image => image.startsWith('ghcr.io/mairie360/bff-dashboard:')).map(image => image.slice(image.lastIndexOf(':') + 1));
      assert.deepEqual(images, [imageTagForContractVersion(version)], stack);
    }
  });

  test('the contract version policy accepts releases and dev packages and maps them to image tags', async () => {
    const { isAcceptedContractVersion, imageTagForContractVersion } = await import('../scripts/contract-version.mjs');
    assert.equal(imageTagForContractVersion('1.1.0'), '1.1.0');
    assert.equal(imageTagForContractVersion('0.0.0-dev.bccf2c39bac5e676c872b2089120d0e3b21ee617'), 'dev-bccf2c3');
    for (const rejected of ['^1.1.0', '1.1', '0.0.0-staging.bccf2c39bac5e676c872b2089120d0e3b21ee617', '0.0.0-dev.bccf2c3', 'latest']) {
      assert.equal(isAcceptedContractVersion(rejected), false, rejected);
    }
  });

  test('response types come from the published package, not from a local copy', () => {
    assert.equal(fs.existsSync(path.join(SRC, 'contracts')), false);
    const contractImports = sources.flatMap(({ file, ast }) => ast.statements.filter(ts.isImportDeclaration)
      .map((statement) => statement.moduleSpecifier.text).filter((specifier) => /contract|openapi/i.test(specifier)).map((specifier) => `${file} ${specifier}`));
    assert.deepEqual(contractImports, [`lib/bff-client.ts ${CONTRACT_PACKAGE}/endpoints/bffDashboard`, `lib/bff-proxy.ts ../../contracts/openapi.json`, `lib/dashboard-bootstrap.ts ${CONTRACT_PACKAGE}/model`, `lib/dashboard-view.ts ${CONTRACT_PACKAGE}/model`, `middleware.ts ../contracts/openapi.json`]);
  });

  test('contracts/openapi.json is the reconstruction of the installed published package', () => {
    const published = loadOrvalContract(CONTRACT_PACKAGE).document;
    const { version } = resolveOrvalPackage(CONTRACT_PACKAGE);
    assert.deepEqual(dashboardContract.document, { openapi: '3.1.0', info: { title: published.info.title, version }, paths: published.paths, components: published.components });
  });
});
