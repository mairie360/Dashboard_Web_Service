const assert = require('node:assert/strict');
const path = require('node:path');
const { test, before, after, beforeEach, afterEach } = require('node:test');
const { ROOT } = require('./support/load-ts.cjs');
const { FrontApp } = require('./support/front-app.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.ts');
const { OpenApiContract } = require('./support/openapi-contract.ts');
const { bootstrapResponse } = require('./support/fixtures.cjs');
const { requestBff } = require('../src/lib/bff-client.ts');
const { setBrowserFrontUrls } = require('../src/lib/front-urls.ts');

// Actual Login owner handlers from published UI0.7.1; the HTTP fixtures use the
// published User refresh operation. This does not certify a deployed account.
const user = new ContractMockServer('USER_OWNER', OpenApiContract.load(path.join(__dirname, 'fixtures/user-session-openapi.json')));
const dashboard = new ContractMockServer('DASHBOARD', OpenApiContract.load(path.join(ROOT, 'contracts/openapi.json')));
const front = new FrontApp();
const savedEnv = Object.fromEntries(['LOGIN_FRONT_URL', 'DASHBOARD_FRONT_URL', 'DASHBOARD_BFF_URL'].map(key => [key, process.env[key]]));
let serial = 0;
let access;
let rotated;
let destinations;
before(async () => {
  await Promise.all([user.start(), dashboard.start()]);
  front.setOwner(user).allow(dashboard.url).install();
  process.env.LOGIN_FRONT_URL = front.ownerOrigin;
  process.env.DASHBOARD_FRONT_URL = front.origin;
  process.env.DASHBOARD_BFF_URL = dashboard.url;
});
after(async () => {
  front.uninstall();
  await Promise.all([user.stop(), dashboard.stop()]);
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
beforeEach(() => {
  front.reset(); user.reset(); dashboard.reset();
  access = 'header.' + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600, sid: ++serial })).toString('base64url') + '.signature';
  rotated = 'rotated-disposable-' + serial;
  front.cookies = { accessToken: 'expired-disposable', refreshToken: 'old-disposable-' + serial };
  destinations = [];
  global.window = { location: { href: front.origin + '/?project=retained', replace: href => destinations.push(href) } };
  setBrowserFrontUrls({ LOGIN_FRONT_URL: front.ownerOrigin });
  user.on('post', '/auth/refresh', { body: { message: 'Session renouvelée.' }, headers: { 'Set-Cookie': [
    `accessToken=${access}; Path=/; HttpOnly; Max-Age=600`,
    `refreshToken=${rotated}; Path=/api; HttpOnly`,
  ] } });
  dashboard.on('get', '/dashboard/bootstrap', request => request.headers.authorization === `Bearer ${access}`
    ? { body: bootstrapResponse() }
    : { status: 401, body: { error: { message: 'Expired' } }, outOfContract: true });
});
afterEach(() => {
  delete global.window;
  assert.deepEqual([...front.violations, ...user.violations, ...dashboard.violations], []);
});

test('concurrent bootstrap reads rotate once at Login and preserve the published payload', async () => {
  const old = front.cookies.refreshToken;
  const values = await Promise.all(Array.from({ length: 6 }, () => requestBff('/dashboard/bootstrap', { headers: { Authorization: 'Bearer forged-browser-value' } })));
  for (const value of values) assert.deepEqual(value, bootstrapResponse());
  assert.equal(user.requests.length, 1);
  assert.deepEqual(user.requests[0].body, { refresh_token: old });
  assert.equal(user.requests[0].headers.authorization, undefined);
  assert.equal(front.cookies.accessToken, access);
  assert.equal(front.cookies.refreshToken, rotated);
  assert.equal(dashboard.requests.length, 12);
  assert.ok(dashboard.requests.every(request => request.headers.cookie === undefined));
  assert.ok(dashboard.requests.every(request => request.headers.authorization !== 'Bearer forged-browser-value'));
  assert.equal(front.calls.filter(call => call.side === 'owner').length, 6);
  assert.deepEqual(destinations, []);
});

test('a second bootstrap401 navigates once to Login with the requested page and never logs out', async () => {
  dashboard.on('get', '/dashboard/bootstrap', { status: 401, body: { error: { message: 'Still expired' } }, outOfContract: true });
  await assert.rejects(requestBff('/dashboard/bootstrap'), /session a expiré/);
  assert.equal(dashboard.requests.length, 2);
  assert.equal(user.requests.length, 1);
  const destination = new URL(destinations[0]);
  assert.equal(destination.origin, front.ownerOrigin);
  assert.equal(destination.pathname, '/');
  assert.equal(destination.searchParams.get('redirect'), window.location.href);
  assert.ok(front.calls.every(call => !call.url.pathname.includes('logout')));
});

for (const status of [401, 503]) {
  test(`owner${status} never retries business data or performs revocation`, async () => {
    user.on('post', '/auth/refresh', { status, body: { message: 'Session indisponible.' }, outOfContract: true });
    const old = { ...front.cookies };
    await assert.rejects(requestBff('/dashboard/bootstrap'), /session/i);
    assert.equal(dashboard.requests.length, 1);
    assert.equal(user.requests.length, 1);
    assert.deepEqual(front.cookies, old);
    assert.equal(destinations.length, status === 401 ? 1 : 0);
    assert.ok(front.calls.every(call => !call.url.pathname.includes('logout')));
  });
}

test('invalid renewal receipt cannot reopen Dashboard or install credentials', async () => {
  user.on('post', '/auth/refresh', { body: { message: 42 }, outOfContract: true });
  const old = { ...front.cookies };
  await assert.rejects(requestBff('/dashboard/bootstrap'), /session/i);
  assert.deepEqual(front.cookies, old);
  assert.equal(dashboard.requests.length, 1);
  assert.deepEqual(destinations, []);
});

test('business outage after renewal delivers rotated cookies and permits an explicit GET retry', async () => {
  dashboard.on('get', '/dashboard/bootstrap', request => request.headers.authorization === `Bearer ${access}`
    ? { status: 503, body: { error: { message: 'Service indisponible.' } }, outOfContract: true }
    : { status: 401, body: { error: { message: 'Expired' } }, outOfContract: true });
  await assert.rejects(requestBff('/dashboard/bootstrap'), /Service indisponible/);
  assert.equal(front.cookies.refreshToken, rotated);
  assert.equal(front.cookies.accessToken, access);
  dashboard.on('get', '/dashboard/bootstrap', { body: bootstrapResponse() });
  assert.deepEqual(await requestBff('/dashboard/bootstrap'), bootstrapResponse());
  assert.equal(user.requests.length, 1);
  assert.equal(dashboard.requests.length, 3);
  assert.deepEqual(destinations, []);
});

test('anonymous browser bearer and cross-site requests never substitute for cookies', async () => {
  front.cookies = {};
  await assert.rejects(requestBff('/dashboard/bootstrap', { headers: { Authorization: 'Bearer forged-browser-value' } }), /session a expiré/);
  assert.equal(dashboard.requests[0].headers.authorization, undefined);
  assert.equal(user.requests.length, 0);
  const response = await front.browserFetch('/api/bff/dashboard/bootstrap', { headers: { Origin: 'https://foreign.test', 'Sec-Fetch-Site': 'cross-site' } });
  assert.equal(response.status, 403);
  assert.equal(dashboard.requests.length, 1);
});
