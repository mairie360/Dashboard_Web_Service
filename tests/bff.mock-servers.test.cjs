const assert = require('node:assert/strict');
const path = require('node:path');
const { test, describe, before, after, beforeEach, afterEach } = require('node:test');
const { ROOT } = require('./support/load-ts.cjs');
const { FrontApp } = require('./support/front-app.cjs');
const { bootstrapResponse } = require('./support/fixtures.cjs');
const { ContractMockServer, unreachableUrl } = require('./support/contract-mock-server.ts');
const { OpenApiContract } = require('./support/openapi-contract.ts');
const { requestBff } = require('../src/lib/bff-client.ts');
const { toDashboardModuleData } = require('../src/lib/dashboard-view.ts');

// Parcours complet d'un appel du front : fetch same-origin du navigateur (src/lib/bff-client.ts) → route
// handler Next.js → BFF_Dashboard simulé par un vrai serveur HTTP local, piloté par contracts/openapi.json :
// ce fichier est reconstruit du paquet publié @mairie360/bff-dashboard-openapi (version X.X.X épinglée) et
// sert aussi de liste blanche au proxy. Le mock rejette les routes, méthodes et paramètres absents du contrat
// et valide les réponses de succès ; BFF_Dashboard est le seul service joignable, tout appel vers une autre
// origine fait échouer le test. Orval ne type que les succès : les erreurs simulées sont `outOfContract`.

const dashboardBff = new ContractMockServer('DASHBOARD_BFF', OpenApiContract.load(path.join(ROOT, 'contracts', 'openapi.json')));
const mocks = [dashboardBff];
const front = new FrontApp();
const TOKEN = 'contract-session-token';

before(async () => {
  await Promise.all(mocks.map((mock) => mock.start()));
  process.env.DASHBOARD_BFF_URL = dashboardBff.url;
  mocks.forEach((mock) => front.allow(mock.url));
  front.install();
});
after(async () => {
  front.uninstall();
  await Promise.all(mocks.map((mock) => mock.stop()));
});
beforeEach(() => {
  mocks.forEach((mock) => mock.reset());
  front.reset();
  front.cookies.accessToken = TOKEN;
});
afterEach(() => {
  assert.deepEqual([...front.violations, ...mocks.flatMap((mock) => mock.violations)], []);
});

const upstreamCalls = () => mocks.flatMap((mock) => mock.requests.map((call) => `${mock.service} ${call.method} ${call.template}`));
const rejection = (promise) => promise.then(() => assert.fail('la requête aurait dû échouer'), (error) => error.message);

describe('page data: /dashboard/bootstrap through the contract-gated proxy', () => {
  test('returns the BFF payload and only reaches the declared operation with the session token', async () => {
    dashboardBff.on('get', '/dashboard/bootstrap', { body: bootstrapResponse() });

    const data = await requestBff('/dashboard/bootstrap');

    assert.deepEqual(data, bootstrapResponse());
    assert.deepEqual(upstreamCalls(), ['DASHBOARD_BFF GET /dashboard/bootstrap']);
    const [call] = dashboardBff.requests;
    assert.equal(call.headers.authorization, `Bearer ${TOKEN}`);
    assert.equal(call.headers.cookie, undefined);
    assert.equal(call.headers.accept, 'application/json');
    assert.deepEqual(call.undeclaredQuery, []);
    assert.deepEqual(front.calls.map(({ side, method, url }) => `${side} ${method} ${url.origin === front.origin ? '' : 'bff'}${url.pathname}`), [
      'browser GET /dashboard/bootstrap',
      'server GET bff/dashboard/bootstrap',
    ]);
    // La page consomme la réponse contractuelle sans erreur de mapping.
    assert.equal(toDashboardModuleData(data).projects.length, 2);
  });

  test('keeps an explicit Authorization header instead of the cookie', async () => {
    dashboardBff.on('get', '/dashboard/bootstrap', { body: bootstrapResponse() });
    await requestBff('/dashboard/bootstrap', { headers: { Authorization: 'Bearer explicit' } });
    assert.equal(dashboardBff.requests[0].headers.authorization, 'Bearer explicit');
  });

  test('forwards no Authorization header without a session cookie', async () => {
    delete front.cookies.accessToken;
    dashboardBff.on('get', '/dashboard/bootstrap', { status: 401, body: { error: { message: 'Session invalide.' } }, outOfContract: true });
    assert.equal(await rejection(requestBff('/dashboard/bootstrap')), 'Session invalide.');
    assert.equal(dashboardBff.requests[0].headers.authorization, undefined);
  });

  for (const [status, message] of [
    // Messages réellement produits par BFF_Dashboard (src/clients/upstream.ts).
    [401, 'Session invalide.'], [502, 'Le service USER_BFF est indisponible.'], [503, 'Le service USER_BFF n’est pas configuré.'],
  ]) {
    test(`surfaces the ${status} error message of the BFF`, async () => {
      dashboardBff.on('get', '/dashboard/bootstrap', { status, body: { error: { message } }, outOfContract: true });
      assert.equal(await rejection(requestBff('/dashboard/bootstrap')), message);
    });
  }

  test('reads a flat { message } error body and falls back to the status without JSON body', async () => {
    dashboardBff.on('get', '/dashboard/bootstrap', { status: 401, body: { message: 'Jeton expiré' }, outOfContract: true });
    assert.equal(await rejection(requestBff('/dashboard/bootstrap')), 'Jeton expiré');
    dashboardBff.on('get', '/dashboard/bootstrap', { status: 503, raw: 'upstream down', contentType: 'text/plain', outOfContract: true });
    assert.equal(await rejection(requestBff('/dashboard/bootstrap')), 'Le service a répondu 503.');
  });

  test('flags a BFF response that breaks the contract', async () => {
    const { sources: _sources, ...invalid } = bootstrapResponse();
    dashboardBff.on('get', '/dashboard/bootstrap', { body: invalid });
    await requestBff('/dashboard/bootstrap');
    assert.deepEqual(dashboardBff.violations, ['[DASHBOARD_BFF] réponse 200 GET /dashboard/bootstrap $.sources: propriété requise manquante']);
    dashboardBff.violations.length = 0;
  });

  test('reports an unreachable BFF as a controlled 502', async () => {
    const offline = await unreachableUrl();
    front.allow(offline);
    process.env.DASHBOARD_BFF_URL = offline;
    try {
      assert.equal(await rejection(requestBff('/dashboard/bootstrap')), 'Le service est indisponible.');
    } finally {
      process.env.DASHBOARD_BFF_URL = dashboardBff.url;
    }
  });
});

describe('connectivity operations declared in the contract', () => {
  for (const operation of ['/health', '/check_apis']) {
    test(`GET ${operation} is forwarded`, async () => {
      dashboardBff.on('get', operation, { status: 200, body: { status: 'ok' } });
      const response = await front.browserFetch(operation);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(upstreamCalls(), [`DASHBOARD_BFF GET ${operation}`]);
    });
  }
});

describe('requests outside the contract never leave the front', () => {
  const cases = [
    ['unknown path', '/projects', {}, 404, 'Route inconnue.'],
    ['path deeper than a declared operation', '/dashboard/bootstrap/extra', {}, 404, 'Route inconnue.'],
    ['undeclared method', '/dashboard/bootstrap', { method: 'POST', body: '{}' }, 405, 'Méthode non autorisée.'],
    ['encoded slash smuggled into a segment', '/dashboard%2Fbootstrap', {}, 400, 'Chemin invalide.'],
  ];
  for (const [name, pathname, init, status, message] of cases) {
    test(`${name} (${init.method ?? 'GET'} ${pathname}) → ${status}`, async () => {
      const response = await front.browserFetch(pathname, init);
      assert.equal(response.status, status);
      assert.deepEqual(await response.json(), { error: { message } });
      if (status === 405) assert.equal(response.headers.get('allow'), 'GET, HEAD');
      assert.deepEqual(front.calls.filter(({ side }) => side === 'server'), []);
      assert.deepEqual(upstreamCalls(), []);
    });
  }

  test('a call to an undeclared origin is refused and reported', async () => {
    await assert.rejects(fetch('https://tracker.example/collect'), /n'est pas un service déclaré/);
    assert.deepEqual(front.violations, ['appel réseau vers une origine non autorisée : GET https://tracker.example/collect']);
    front.violations.length = 0;
  });

  test('the OpenAPI document of the BFF is the only path forwarded without being declared', async () => {
    // Exception volontaire du proxy : /openapi.json et /swagger.json sont relayés pour exposer le
    // contrat, bien qu'ils ne figurent pas dans contracts/openapi.json.
    const metadataBff = new ContractMockServer('DASHBOARD_BFF', dashboardBff.contract)
      .allowDeviation(/GET \/(openapi|swagger)\.json n'existe pas dans le contrat/, 'document OpenAPI relayé par le proxy hors contrat');
    await metadataBff.start();
    front.allow(metadataBff.url);
    process.env.DASHBOARD_BFF_URL = metadataBff.url;
    try {
      for (const document of ['/openapi.json', '/swagger.json']) {
        assert.equal((await front.browserFetch(document)).status, 404);
        assert.equal((await front.browserFetch(document, { method: 'DELETE' })).status, 405);
      }
      assert.deepEqual(front.calls.filter(({ side }) => side === 'server').map(({ method, url }) => `${method} ${url.pathname}`), ['GET /openapi.json', 'GET /swagger.json']);
      assert.deepEqual(metadataBff.violations, []);
    } finally {
      process.env.DASHBOARD_BFF_URL = dashboardBff.url;
      await metadataBff.stop();
    }
  });
});
