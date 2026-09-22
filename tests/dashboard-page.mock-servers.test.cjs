const assert = require('node:assert/strict');
const path = require('node:path');
const { test, before, after, beforeEach, afterEach } = require('node:test');
const { ROOT } = require('./support/load-ts.cjs');
const { installReactRuntime, mount } = require('./support/server-view.cjs');

// HTML of the dashboard page (src/app/page.tsx) rendered with react-dom/server against the mocked
// BFF_Dashboard: the real page and the real DashboardModule of @mairie360/lib-components are rendered, the
// hook state is kept between render passes (tests/support/server-view.cjs), so the markup reflects what the
// BFF answered through the contract-gated proxy.

installReactRuntime();
const React = require('react');
const { FrontApp } = require('./support/front-app.cjs');
const { bootstrapResponse } = require('./support/fixtures.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.ts');
const { OpenApiContract } = require('./support/openapi-contract.ts');
const { REPORTS_UNAVAILABLE } = require('../src/lib/dashboard-view.ts');
const { setBrowserFrontUrls } = require('../src/lib/front-urls.ts');
const Home = require('../src/app/page.tsx').default;

const dashboardBff = new ContractMockServer('DASHBOARD_BFF', OpenApiContract.load(path.join(ROOT, 'contracts', 'openapi.json')));
const front = new FrontApp();
const TOKEN = 'contract-session-token';
let view;

before(async () => {
  await dashboardBff.start();
  process.env.DASHBOARD_BFF_URL = dashboardBff.url;
  front.allow(dashboardBff.url).install();
  // What the root layout reads from the runtime environment and hands to the browser.
  setBrowserFrontUrls({
    CALENDAR_FRONT_URL: 'https://calendar.test.example/',
    PROJECT_FRONT_URL: 'https://project.test.example/',
    FILES_FRONT_URL: 'https://files.test.example/',
    MESSAGE_FRONT_URL: 'https://message.test.example/',
  });
});
after(async () => {
  front.uninstall();
  await dashboardBff.stop();
});
beforeEach(() => {
  dashboardBff.reset();
  front.reset();
  front.cookies.accessToken = TOKEN;
  global.window = { location: { href: '' } };
});
afterEach(() => {
  view?.unmount();
  view = undefined;
  delete global.window;
  assert.deepEqual([...front.violations, ...dashboardBff.violations], []);
});

const upstreamCalls = () => dashboardBff.requests.map((call) => `${call.method} ${call.template}`);

async function renderLoadedPage(body = bootstrapResponse()) {
  dashboardBff.on('get', '/dashboard/bootstrap', { body });
  view = mount(React.createElement(Home));
  return view.waitFor((html) => !html.includes('Chargement du tableau de bord'));
}

test('the first pass renders the loading state, the next one the data of GET /dashboard/bootstrap', async () => {
  dashboardBff.on('get', '/dashboard/bootstrap', { body: bootstrapResponse() });
  view = mount(React.createElement(Home));

  assert.equal(view.passes, 1);
  assert.match(view.html, /<p role="status">Chargement du tableau de bord…<\/p>/);
  assert.equal(view.find('DashboardModule').length, 0);

  const html = await view.waitFor((current) => !current.includes('Chargement du tableau de bord'));

  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap']);
  assert.equal(dashboardBff.requests[0].headers.authorization, `Bearer ${TOKEN}`);
  assert.doesNotMatch(html, /role="alert"/);
  assert.match(view.text(), /Projets accessibles : 17\./);
  for (const expected of ['Budget participatif', 'Rénovation de la médiathèque', 'Validation', 'Relecture', 'Conseil municipal', 'Permanence']) {
    assert.match(view.text(), new RegExp(expected), `${expected} is rendered`);
  }
  const module = view.props('DashboardModule');
  assert.equal(module.userFirstName, 'Alice');
  assert.deepEqual(module.projects.map((project) => project.status), ['in-progress', 'completed']);
  assert.match(view.text(), /1 déc\. 2026/);
  assert.match(view.text(), /Sans échéance/);
});

test('an unavailable source is announced above the module', async () => {
  const html = await renderLoadedPage(bootstrapResponse({ sources: { projects: 'available', tasks: 'unavailable', calendar: 'available' } }));

  assert.match(html, /<p role="status"[^>]*>Certaines données sont temporairement indisponibles\.<\/p>/);
  assert.match(view.text(), /Budget participatif/);
});

test('a BFF error is rendered as an alert and the dashboard stays unavailable', async () => {
  dashboardBff.on('get', '/dashboard/bootstrap', { status: 502, body: { error: { message: 'BFF Project injoignable' } }, outOfContract: true });
  view = mount(React.createElement(Home));

  const html = await view.waitFor((current) => current.includes('role="alert"'));

  assert.match(html, /<p role="alert"[^>]*>BFF Project injoignable<\/p>/);
  assert.match(html, /<p role="status">Le tableau de bord est indisponible\.<\/p>/);
  assert.equal(view.find('DashboardModule').length, 0);
});

test('an unreachable proxy target becomes the controlled error of the page', async () => {
  const closed = await require('./support/contract-mock-server.ts').unreachableUrl();
  front.allow(closed);
  process.env.DASHBOARD_BFF_URL = closed;
  try {
    view = mount(React.createElement(Home));
    const html = await view.waitFor((current) => current.includes('role="alert"'));
    assert.match(html, /<p role="alert"[^>]*>[^<]+<\/p>/);
    assert.deepEqual(upstreamCalls(), []);
  } finally {
    process.env.DASHBOARD_BFF_URL = dashboardBff.url;
  }
});

test('quick actions either navigate to another front or show the notice for reports', async () => {
  await renderLoadedPage();
  const module = view.props('DashboardModule');

  await view.act(() => module.onQuickAction('view-reports'));
  assert.match(view.html, new RegExp(`<p role="status"[^>]*>${REPORTS_UNAVAILABLE.replace('.', '\\.')}</p>`));
  assert.equal(window.location.href, '');

  await view.act(() => view.props('DashboardModule').onQuickAction('schedule-event'));
  assert.equal(window.location.href, 'https://calendar.test.example/');

  await view.act(() => view.props('DashboardModule').onViewAllProjects());
  assert.equal(window.location.href, 'https://project.test.example/');

  await view.act(() => view.props('DashboardModule').onQuickAction('new-document'));
  assert.equal(window.location.href, 'https://files.test.example/');

  await view.act(() => view.props('DashboardModule').onQuickAction('contact-team'));
  assert.equal(window.location.href, 'https://message.test.example/');
  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap'], 'navigation never calls the BFF again');
});
