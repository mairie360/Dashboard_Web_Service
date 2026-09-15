const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test, describe } = require('node:test');
const ts = require('typescript');
const { ROOT, SRC } = require('./support/load-ts.cjs');
const { ROUTES } = require('./support/front-app.cjs');
const { OpenApiContract } = require('./support/openapi-contract.ts');
const { loadOrvalContract, resolveOrvalPackage } = require('./support/orval-contract.ts');

// Analyse statique des sources : chaque appel réseau du front doit viser une opération déclarée.
// - navigateur → front : `requestBff(<chemin littéral>, { method })` doit exister dans contracts/openapi.json ;
// - serveur → BFF User : `userBffRequest(request, <chemin littéral>)` doit exister, pour la méthode du
//   handler exporté, dans le contrat du paquet @mairie360/bff-user-openapi installé ;
// - `fetch` n'est appelé que par ces deux points d'entrée, et aucune autre API réseau n'est utilisée.
// Les tests avec mock serveurs (tests/bff.mock-servers.test.cjs) vérifient le même périmètre à l'exécution.

const dashboardContract = OpenApiContract.load(path.join(ROOT, 'contracts', 'openapi.json'));
const userContract = loadOrvalContract('@mairie360/bff-user-openapi');
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

/** Nom de la fonction exportée (GET, POST…) qui contient le nœud. */
function enclosingHandler(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isFunctionDeclaration(current) && current.name) return current.name.text;
  }
  return undefined;
}

const browserCalls = sources.flatMap(({ file, ast }) => (file === 'lib/bff-client.ts' ? [] : calls(ast, 'requestBff').map((node) => ({ ast, node }))));
const userBffCalls = sources.flatMap(({ ast }) => calls(ast, 'userBffRequest').filter((node) => node.arguments.length === 2).map((node) => ({ ast, node })));

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

  test('session adapters call BFF User operations declared for their own HTTP method', () => {
    assert.ok(userBffCalls.length > 0);
    const problems = userBffCalls.flatMap(({ ast, node }) => {
      const pathname = literal(node.arguments[1]);
      const method = enclosingHandler(node);
      if (pathname === undefined || !method) return [`${where(ast, node)} : chemin ou handler non vérifiable`];
      return userContract.match(method, pathname) ? [] : [`${where(ast, node)} : ${method} ${pathname} absent du contrat ${userContract.title}`];
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

describe('BFF User contract package', () => {
  test('the installed version is the one pinned in package.json and deployed by the test stacks', () => {
    const { devDependencies } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const { version } = resolveOrvalPackage('@mairie360/bff-user-openapi');
    assert.equal(version, devDependencies['@mairie360/bff-user-openapi']);
    for (const stack of ['docker-compose-security.yml', 'docker-compose-performance.yml']) {
      assert.match(fs.readFileSync(path.join(ROOT, stack), 'utf8'), new RegExp(`ghcr\\.io/mairie360/bff-user:${version.replace(/\./g, '\\.')}\\}`), stack);
    }
  });
});
