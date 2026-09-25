const assert = require('node:assert/strict');
const path = require('node:path');
const { test, before, after, beforeEach, afterEach } = require('node:test');
const { ROOT } = require('./support/load-ts.cjs');
const { installReactRuntime, mount } = require('./support/server-view.cjs');

// HTML of the dashboard page (src/app/page.tsx) rendered with react-dom/server against the mocked
// BFF_Dashboard: the real page and the Dashboard section components of @mairie360/lib-components are rendered, the
// hook state is kept between render passes (tests/support/server-view.cjs), so the markup reflects what the
// BFF answered through the contract-gated proxy.

installReactRuntime();
const React = require('react');
const { FrontApp } = require('./support/front-app.cjs');
const { bootstrapResponse } = require('./support/fixtures.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.ts');
const { OpenApiContract } = require('./support/openapi-contract.ts');
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
  assert.equal(view.find('DashboardRecentProjects').length, 0);

  const html = await view.waitFor((current) => !current.includes('Chargement du tableau de bord'));

  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap']);
  assert.equal(dashboardBff.requests[0].headers.authorization, `Bearer ${TOKEN}`);
  assert.doesNotMatch(html, /role="alert"/);
  assert.match(view.text(), /Bienvenue Alice/);
  assert.doesNotMatch(view.text(), /Projets accessibles|Actions rapides|Voir les rapports/);
  for (const expected of ['Budget participatif', 'Rénovation de la médiathèque', 'Validation', 'Relecture', 'Conseil municipal', 'Permanence']) {
    assert.match(view.text(), new RegExp(expected), `${expected} is rendered`);
  }
  assert.deepEqual(view.props('DashboardRecentProjects').projects.map((project) => project.status), ['in-progress', 'completed']);
  assert.equal(view.find('DashboardQuickActions').length, 0);
  assert.match(view.text(), /1 déc\. 2026/);
  assert.match(view.text(), /Sans échéance/);
});

test('an unavailable source is announced above the real sections', async () => {
  const html = await renderLoadedPage(bootstrapResponse({ sources: { projects: 'available', tasks: 'unavailable', calendar: 'available' } }));

  assert.match(html, /<p role="status"[^>]*>Certaines données sont temporairement indisponibles\.<\/p>/);
  assert.match(view.text(), /Budget participatif/);
});

test('empty BFF collections stay empty instead of showing library fixtures', async () => {
  const html = await renderLoadedPage(bootstrapResponse({ projects: [], tasks: [], events: [], metrics: { totalProjects: 0 } }));

  assert.match(html, /Aucun projet récent\./);
  assert.match(html, /Aucune tâche en attente\./);
  assert.match(html, /Aucun événement à venir\./);
  assert.doesNotMatch(html, /Actions rapides|Voir les rapports|Budget participatif|Conseil municipal/);
});

test('a BFF error is rendered as an alert and the dashboard stays unavailable', async () => {
  dashboardBff.on('get', '/dashboard/bootstrap', { status: 502, body: { error: { message: 'BFF Project injoignable' } }, outOfContract: true });
  view = mount(React.createElement(Home));

  const html = await view.waitFor((current) => current.includes('role="alert"'));

  assert.match(html, /<p role="alert"[^>]*>BFF Project injoignable<\/p>/);
  assert.match(html, /<p role="status">Le tableau de bord est indisponible\.<\/p>/);
  assert.equal(view.find('DashboardRecentProjects').length, 0);
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

test('real sections navigate to the configured project and calendar fronts', async () => {
  await renderLoadedPage();
  assert.doesNotMatch(view.html, /Actions rapides|Voir les rapports|Projets accessibles/);
  await view.act(() => view.props('DashboardRecentProjects').onViewAll());
  assert.equal(window.location.href, 'https://project.test.example/');
  await view.act(() => view.props('DashboardRecentProjects').onSelect(view.props('DashboardRecentProjects').projects[0]));
  assert.equal(window.location.href, 'https://project.test.example/?project=project-42');
  await view.act(() => view.props('DashboardPendingTasks').onSelect(view.props('DashboardPendingTasks').tasks[0]));
  assert.equal(window.location.href, 'https://project.test.example/?project=project-42&task=task-2');
  await view.act(() => view.props('DashboardUpcomingEvents').onOpenCalendar());
  assert.equal(window.location.href, 'https://calendar.test.example/');
  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap'], 'navigation never calls the BFF again');
});

test('project links preserve configured query values and encode BFF identifiers', async () => {
  setBrowserFrontUrls({ PROJECT_FRONT_URL: 'https://project.test.example/?source=dashboard' });
  await renderLoadedPage(bootstrapResponse({
    projects: [{ id: 'project/42', title: 'Budget', progress: 0, status: 'review', dueDate: '2026-12-01' }],
    tasks: [{ id: 'task & 2', title: 'Validation', dueDate: '', priority: 'high', completed: false, projectId: 'project/42' }],
  }));

  await view.act(() => view.props('DashboardPendingTasks').onSelect(view.props('DashboardPendingTasks').tasks[0]));
  const destination = new URL(window.location.href);
  assert.equal(destination.searchParams.get('source'), 'dashboard');
  assert.equal(destination.searchParams.get('project'), 'project/42');
  assert.equal(destination.searchParams.get('task'), 'task & 2');
  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap']);
});

test('selecting an upcoming event deep-links to its date and ID without another BFF call', async () => {
  setBrowserFrontUrls({ CALENDAR_FRONT_URL: 'https://calendar.test.example/?source=dashboard' });
  await renderLoadedPage();

  const section = view.props('DashboardUpcomingEvents');
  await view.act(() => section.onSelect(section.events[0]));

  const destination = new URL(window.location.href);
  assert.equal(destination.origin, 'https://calendar.test.example');
  assert.equal(destination.searchParams.get('source'), 'dashboard');
  assert.equal(destination.searchParams.get('date'), section.events[0].startsAt.slice(0, 10));
  assert.equal(destination.searchParams.get('event'), section.events[0].id);
  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap']);
});

test('section actions do not navigate when their front URL is not configured', async () => {
  setBrowserFrontUrls({});
  await renderLoadedPage();

  await view.act(() => view.props('DashboardRecentProjects').onViewAll());
  await view.act(() => view.props('DashboardRecentProjects').onSelect(view.props('DashboardRecentProjects').projects[0]));
  await view.act(() => view.props('DashboardPendingTasks').onSelect(view.props('DashboardPendingTasks').tasks[0]));
  await view.act(() => view.props('DashboardUpcomingEvents').onOpenCalendar());
  await view.act(() => view.props('DashboardUpcomingEvents').onSelect(view.props('DashboardUpcomingEvents').events[0]));
  assert.equal(window.location.href, '');
});
