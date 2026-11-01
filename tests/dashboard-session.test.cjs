const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');
require('./support/load-ts.cjs');
const { NextRequest } = require('next/server');
const { middleware, config } = require('../src/middleware.ts');
const { requestBff } = require('../src/lib/bff-client.ts');
const { setBrowserFrontUrls } = require('../src/lib/front-urls.ts');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const originalFetch = global.fetch;
const originalLogin = process.env.LOGIN_FRONT_URL;
const originalDashboard = process.env.DASHBOARD_FRONT_URL;
const destinations = [];
const token = exp => `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify({exp})).toString('base64url')}.test-signature`;
const request = (pathname='/', cookie, method='GET') => new NextRequest(`https://dashboard.test.example${pathname}`, {
  method, headers: cookie === undefined ? {} : {cookie:`accessToken=${cookie}`},
});
beforeEach(()=>{
  destinations.length=0;
  process.env.LOGIN_FRONT_URL='https://login.test.example/';
  process.env.DASHBOARD_FRONT_URL='https://dashboard.test.example/';
  setBrowserFrontUrls({LOGIN_FRONT_URL:'https://login.test.example/'});
  global.window={location:{href:'https://dashboard.test.example/?project=retained',replace:href=>destinations.push(href)}};
});
afterEach(()=>{
  global.fetch=originalFetch;delete global.window;
  if(originalLogin===undefined)delete process.env.LOGIN_FRONT_URL;else process.env.LOGIN_FRONT_URL=originalLogin;
  if(originalDashboard===undefined)delete process.env.DASHBOARD_FRONT_URL;else process.env.DASHBOARD_FRONT_URL=originalDashboard;
});

test('an anonymous page resumes at its configured frontend before a bootstrap read',()=>{
  const response=middleware(request('/?project=retained'));
  assert.equal(response.status,307);
  assert.equal(new URL(response.headers.get('location')).origin,'https://dashboard.test.example');
  assert.equal(new URL(response.headers.get('location')).pathname,'/api/auth/resume');
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('set-cookie'),null,'Dashboard does not own shared-cookie expiry');
});

for(const file of ['docker-compose-security.yml','docker-compose-performance.yml']){
  test(`isolated frontend readiness in ${file} has a safe configured Login without changing the probe`,()=>{
    const service=yaml.load(fs.readFileSync(path.join(__dirname,'..',file),'utf8')).services['dashboard-front'];
    process.env.LOGIN_FRONT_URL=service.environment.LOGIN_FRONT_URL;
    process.env.DASHBOARD_FRONT_URL=service.environment.DASHBOARD_FRONT_URL;
    const probe=service.healthcheck.test;
    assert.deepEqual(probe,['CMD','curl','-fsS','-o','/dev/null','http://localhost:5000/']);
    const response=middleware(new NextRequest(probe.at(-1)));
    assert.equal(response.status,307);
    assert.equal(new URL(response.headers.get('location')).pathname,'/api/auth/resume');
    assert.equal(new URL(response.headers.get('location')).origin,new URL(service.environment.DASHBOARD_FRONT_URL).origin);
    assert.equal(response.headers.get('set-cookie'),null);
  });
}

test('a known-expired cookie uses local resume without automatically revoking the session',()=>{
  const response=middleware(request('/',token(1)));
  assert.equal(response.status,307);
  assert.equal(new URL(response.headers.get('location')).pathname,'/api/auth/resume');
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('set-cookie'),null);
});

for(const [method,status] of [['HEAD',307],['POST',401]]){
  test(`anonymous page ${method} responds with ${status}, never forwards a mutation`,()=>{
    const response=middleware(request('/',undefined,method));
    assert.equal(response.status,status);
    assert.equal(response.headers.get('cache-control'),'no-store');
  });
}

for(const path of ['/dashboard/bootstrap','/health','/check_apis']){
  test(`anonymous data ${path} receives JSON401, not a cross-origin redirect`,async()=>{
    const response=middleware(request(path));
    assert.equal(response.status,401);
    assert.equal(response.headers.get('location'),null);
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.match(response.headers.get('content-type'),/application\/json/);
    assert.match((await response.json()).error.message,/reconnecter/);
  });
}

test('a rejected data mutation is not redirected or replayed',()=>{
  const response=middleware(request('/dashboard/bootstrap',token(1),'POST'));
  assert.equal(response.status,401);assert.equal(response.headers.get('location'),null);
});

for(const value of ['', 'javascript:alert(1)', 'https://user:pass@dashboard.test.example/']){
  test(`unavailable or unsafe public frontend ${JSON.stringify(value)} fails closed`,()=>{
    process.env.DASHBOARD_FRONT_URL=value;
    const response=middleware(request());
    assert.equal(response.status,503);assert.equal(response.headers.get('location'),null);
    assert.equal(response.headers.get('cache-control'),'no-store');
  });
}

test('a finite unexpired JWT preserves the nonce CSP without pretending signature validation',()=>{
  const response=middleware(request('/',token(4102444800)));
  assert.equal(response.status,200);
  const nonce=response.headers.get('x-middleware-request-x-nonce');assert.ok(nonce);
  assert.match(response.headers.get('content-security-policy'),new RegExp(`nonce-${nonce}`));
  assert.equal(middleware(request('/','opaque-session-token')).status,307);
});

for(const pathname of ['/openapi.json','/swagger.json'])test(`metadata ${pathname} is unavailable without a BFF request`,()=>{
  const response=middleware(request(pathname));assert.equal(response.status,404);assert.equal(response.headers.get('location'),null);
});

test('metadata JSON paths are explicitly covered despite their file extension',()=>{
  assert.ok(config.matcher.includes('/openapi.json'));assert.ok(config.matcher.includes('/swagger.json'));
});

test('concurrent refused reads share one local refresh and hand off to Login without replay',async()=>{
  const calls=[];
  global.fetch=async path=>{calls.push(path);return Response.json({error:{message:'Session refusée'}},{status:401});};
  await Promise.all([assert.rejects(requestBff('/dashboard/bootstrap'),/Session refusée/),assert.rejects(requestBff('/dashboard/bootstrap'),/Session refusée/)]);
  assert.deepEqual(destinations,['https://login.test.example/?redirect=https%3A%2F%2Fdashboard.test.example%2F%3Fproject%3Dretained']);
  assert.deepEqual(calls,['/dashboard/bootstrap','/dashboard/bootstrap','/api/auth/refresh']);
});

for(const status of [403,503]){
  test(`${status} never implies session cleanup`,async()=>{
    global.fetch=async()=>Response.json({error:{message:'Lecture refusée'}},{status});
    await assert.rejects(requestBff('/dashboard/bootstrap'),/Lecture refusée/);
    assert.deepEqual(destinations,[]);
  });
}

test('an aborted late401 cannot navigate even when transport ignores the signal',async()=>{
  const controller=new AbortController();let release;
  global.fetch=()=>new Promise(resolve=>{release=resolve;});
  const pending=requestBff('/dashboard/bootstrap',{signal:controller.signal});
  controller.abort();release(Response.json({error:{message:'Late401'}},{status:401}));
  await assert.rejects(pending,{name:'AbortError'});assert.deepEqual(destinations,[]);
});

test('an already aborted read never calls fetch or navigates',async()=>{
  const controller=new AbortController();controller.abort();
  global.fetch=()=>assert.fail('no request for an aborted read');
  await assert.rejects(requestBff('/dashboard/bootstrap',{signal:controller.signal}),{name:'AbortError'});
  assert.deepEqual(destinations,[]);
});

test('a transport failure never guesses a401',async()=>{
  global.fetch=async()=>{throw new TypeError('Network failure');};
  await assert.rejects(requestBff('/dashboard/bootstrap'),/Network failure/);assert.deepEqual(destinations,[]);
});

test('a missing Login URL yields an actionable refusal and permits a corrected explicit retry',async()=>{
  setBrowserFrontUrls({});global.fetch=async()=>Response.json({error:{message:'Session refusée'}},{status:401});
  await assert.rejects(requestBff('/dashboard/bootstrap'),/Connexion temporairement indisponible/);
  assert.deepEqual(destinations,[]);
  setBrowserFrontUrls({LOGIN_FRONT_URL:'https://login.test.example/'});
  await assert.rejects(requestBff('/dashboard/bootstrap'),/Session refusée/);
  assert.deepEqual(destinations,['https://login.test.example/?redirect=https%3A%2F%2Fdashboard.test.example%2F%3Fproject%3Dretained']);
});

for (const cookie of [undefined, token(1)]) {
  test(`missing/expired access on a protected document requests owner recovery without exposing its API-scoped refresh`, () => {
    process.env.DASHBOARD_FRONT_URL = 'https://dashboard.test.example/';
    const response = middleware(request('/?project=retained&task=42', cookie));
    assert.equal(response.status, 307);
    const destination = new URL(response.headers.get('location'));
    assert.equal(destination.origin, 'https://dashboard.test.example');
    assert.equal(destination.pathname, '/api/auth/resume');
    assert.equal(destination.searchParams.get('next'), '/?project=retained&task=42');
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
}

test('page guard preserves refresh credentials for the owner and never tries a GET renewal itself', () => {
  process.env.DASHBOARD_FRONT_URL = 'https://dashboard.test.example/';
  global.fetch = () => assert.fail('document guard never performs renewal or revocation');
  const response = middleware(new NextRequest('https://dashboard.test.example/', { headers: { cookie: 'refreshToken=disposable-cookie-only-on-api' } }));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(new URL(response.headers.get('location')).pathname, '/api/auth/resume');
  assert.ok(!response.headers.get('location').includes('disposable-cookie'));
});
