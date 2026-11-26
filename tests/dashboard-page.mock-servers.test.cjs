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
const Home = require('../src/components/DashboardPage/index.ts').default;

const dashboardBff = new ContractMockServer('DASHBOARD_BFF', OpenApiContract.load(path.join(ROOT, 'contracts', 'openapi.json')));
const front = new FrontApp();
const TOKEN = 'contract-session-token';
let view;

before(async () => {
  await dashboardBff.start();
  process.env.DASHBOARD_BFF_URL = dashboardBff.url;
  front.allow(dashboardBff.url).install();
});
after(async () => {
  front.uninstall();
  await dashboardBff.stop();
});
beforeEach(() => {
  // What the root layout reads from the runtime environment and hands to the browser.
  setBrowserFrontUrls({
    LOGIN_FRONT_URL: 'https://login.test.example/',
    CALENDAR_FRONT_URL: 'https://calendar.test.example/',
    PROJECT_FRONT_URL: 'https://project.test.example/',
    FILES_FRONT_URL: 'https://files.test.example/',
    MESSAGE_FRONT_URL: 'https://message.test.example/',
    SETTINGS_FRONT_URL: 'https://settings.test.example/',
    ADMINISTRATION_FRONT_URL: 'https://admin.test.example/',
  });
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

// Deliberately malformed successful replies, not published-contract conformance claims.
const unusableBootstraps = [
  ['null', () => null], ['array', () => []], ['missing collections', () => ({ userFirstName: 'Unverified' })],
  ['invalid first name', () => bootstrapResponse({ userFirstName: null })],
  ['projects object', () => bootstrapResponse({ projects: {} })],
  ['tasks object', () => bootstrapResponse({ tasks: {} })],
  ['events object', () => bootstrapResponse({ events: {} })],
  ['sources null', () => bootstrapResponse({ sources: null })],
  ['sources array', () => bootstrapResponse({ sources: [] })],
  ...['projects', 'tasks', 'calendar'].flatMap(source => [
    [`missing ${source} source`, () => { const body = bootstrapResponse(); delete body.sources[source]; return body; }],
    [`invalid ${source} source`, () => { const body = bootstrapResponse(); body.sources[source] = 'unknown'; return body; }],
  ]),
  ...['projects', 'tasks', 'events'].map(collection => [
    `null ${collection} entry`, () => bootstrapResponse({ [collection]: [null] }),
  ]),
  ...[
    ['projects', 'id', 9], ['projects', 'title', {}], ['projects', 'progress', '50'],
    ['projects', 'status', 'unknown'], ['projects', 'dueDate', null],
    ['tasks', 'id', 9], ['tasks', 'projectId', null], ['tasks', 'title', false],
    ['tasks', 'dueDate', {}], ['tasks', 'priority', 'unknown'],
    ['events', 'id', false], ['events', 'title', {}], ['events', 'date', 9],
    ['events', 'startTime', 9], ['events', 'location', {}],
  ].map(([collection, key, value]) => [
    `${collection}.${key}`, () => { const body = bootstrapResponse(); body[collection][0][key] = value; return body; },
  ]),
];
for (const [label, body] of unusableBootstraps) {
  test(`unusable initial bootstrap (${label}) exposes controlled GET-only recovery`, async () => {
    dashboardBff.on('get', '/dashboard/bootstrap', { body: body(), outOfContract: true });
    view = mount(React.createElement(Home));
    await view.waitFor(html => html.includes('role="alert" data-tone="danger"'));
    assert.match(view.text(), /Les données reçues du tableau de bord sont incohérentes/);
    assert.match(view.text(), /Le tableau de bord est indisponible/);
    assert.match(view.text(), /Réessayer le chargement/);
    assert.equal(view.find('DashboardRecentProjects').length, 0);
    assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap']);
    dashboardBff.on('get', '/dashboard/bootstrap', { body: bootstrapResponse() });
    await view.click((_props, text, tag) => tag === 'button' && text === 'Réessayer le chargement');
    await view.waitFor(html => html.includes('Budget participatif'));
    assert.doesNotMatch(view.html, /role="alert" data-tone="danger"|incohérentes/);
    assert.deepEqual(upstreamCalls(), Array(2).fill('GET /dashboard/bootstrap'));
  });
  test(`unusable refreshed bootstrap (${label}) keeps confirmed cards and identity`, async () => {
    await renderLoadedPage(bootstrapResponse({ sources: { projects: 'available', tasks: 'available', calendar: 'unavailable' } }));
    // Isolate the existing logout-error path without a valid Login destination.
    setBrowserFrontUrls({ PROJECT_FRONT_URL: 'https://project.test.example/' });
    await view.act(() => view.props('AppShell').onLogout());
    dashboardBff.on('get', '/dashboard/bootstrap', { body: body(), outOfContract: true });
    await view.click((_props, text, tag) => tag === 'button' && text === 'Actualiser les données indisponibles');
    await view.waitFor(html => html.includes('incohérentes'));
    assert.equal(view.props('AppShell').user.first_name, 'Alice');
    assert.match(view.text(), /Budget participatif/);
    assert.match(view.text(), /Les dernières données reçues restent affichées/);
    assert.match(view.text(), /La déconnexion est temporairement indisponible/);
    await view.act(() => view.props('DashboardPendingTasks').onSelect(view.props('DashboardPendingTasks').tasks[0]));
    assert.equal(window.location.href, 'https://project.test.example/?project=project-42&task=task-2');
    assert.equal(upstreamCalls().length, 2, 'no automatic retry or mutation from retained cards');
    dashboardBff.on('get', '/dashboard/bootstrap', { body: bootstrapResponse({ userFirstName: 'Nouveau confirmé', projects: [], tasks: [], events: [] }) });
    await view.click((_props, text, tag) => tag === 'button' && text === 'Réessayer le chargement');
    await view.waitFor(html => /Bon(?:jour|soir) Nouveau confirmé/.test(html));
    assert.doesNotMatch(view.html, /incohérentes|Budget participatif/);
    assert.match(view.text(), /Aucun projet récent|Aucune tâche en attente|Aucun événement à venir/);
    assert.match(view.text(), /La déconnexion est temporairement indisponible/);
    assert.deepEqual(upstreamCalls(), Array(3).fill('GET /dashboard/bootstrap'));
  });
}

test('optional event fields and unrecognized display text remain usable bootstrap data', async () => {
  const body = bootstrapResponse({ events: [{ id: 0, title: '', date: '2028-02-29' },
    { id: 'unusable-date', title: 'Unusable date value', date: '2026-02-31' }] });
  body.projects[0].dueDate = '3';
  body.tasks[0].dueDate = '';
  body.userFirstName = '';
  body.metrics.totalProjects = null;
  body.metrics.eventsThisMonth = null;
  await renderLoadedPage(body);
  assert.doesNotMatch(view.html, /role="alert" data-tone="danger"/);
  assert.match(view.text(), /Bienvenue sur votre espace Mairie360\./);
  assert.equal(view.props('DashboardRecentProjects').projects[0].dueDate, '3');
  assert.equal(view.props('DashboardPendingTasks').tasks[0].dueLabel, 'Sans échéance');
  assert.deepEqual(view.props('DashboardUpcomingEvents').events.map(event => event.id), ['0']);
  assert.match(view.text(), /Certains événements reçus/);
  // No count from the BFF: the tile titles stay alone.
  assert.doesNotMatch(view.text(), /Projets récents ·|Événements à venir ·/);
  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap']);
});

test('MAIR-1177: the tile headers show the projects count and the events of the month from the contract', async () => {
  const html = await renderLoadedPage();
  assert.match(view.text(), /Projets récents · 17 projets/);
  assert.match(view.text(), /Événements à venir · 2 en septembre/);
  assert.match(html, /<span class="dashboard-panel-title">Projets récents<\/span>/);
  assert.equal((html.match(/class="[^"]*dashboard-panel-indicator[^"]*"/g) || []).length, 2);
  assert.doesNotMatch(view.text(), /Tâches en attente ·|Mes formations ·/);
  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap']);
});

test('the first pass renders the loading state, the next one the data of GET /dashboard/bootstrap', async () => {
  dashboardBff.on('get', '/dashboard/bootstrap', { body: bootstrapResponse() });
  view = mount(React.createElement(Home));

  assert.equal(view.passes, 1);
  assert.equal((view.html.match(/<h1\b/g) || []).length, 1);
  // MAIR-899: the announcement is for screen readers; the tiles are drawn at once with 3 skeleton rows each.
  assert.match(view.html, /<p role="status" class="sr-only">Chargement du tableau de bord…<\/p>/);
  assert.match(view.html, /Bon(?:jour|soir)/);
  for (const title of ['Projets récents', 'Tâches en attente', 'Événements à venir', 'Mes formations']) assert.match(view.html, new RegExp(title));
  assert.equal((view.html.match(/data-skeleton="/g) || []).length, 12);
  assert.equal(view.props('DashboardRecentProjects').loading, true);

  const html = await view.waitFor((current) => !current.includes('Chargement du tableau de bord'));

  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap']);
  assert.equal(dashboardBff.requests[0].headers.authorization, `Bearer ${TOKEN}`);
  assert.doesNotMatch(html, /role="alert" data-tone="danger"/);
  assert.doesNotMatch(html, /<main\b[^>]*>0(?:<|$)/, 'The zero unusable-event count is not rendered as text');
  assert.match(view.text(), /Bon(?:jour|soir) Alice/);
  assert.equal(view.find('AppShell').length, 1);
  assert.doesNotMatch(html, /<aside\b[^]*?<footer\b[^]*?<\/footer>[^]*?<\/aside>/);
  // MAIR-1106: the page base of lib-components 2.3 has no footer.
  assert.doesNotMatch(html, /<footer\b|role="contentinfo"/);
  assert.equal(view.props('AppShell').activeItem, 'dashboard');
  assert.equal(view.props('AppShell').user.first_name, 'Alice');
  assert.equal(view.props('AppShell').hrefs.profile, 'https://settings.test.example/');
  assert.equal(view.props('AppShell').isAdmin, false);
  assert.equal(typeof view.props('AppShell').onLogout, 'function');
  assert.doesNotMatch(html, />Administration</);
  assert.match(html, /aria-label="Notifications"/);
  assert.doesNotMatch(view.text(), /Projets accessibles|Actions rapides|Voir les rapports/);
  for (const expected of ['Budget participatif', 'Rénovation de la médiathèque', 'Validation', 'Relecture', 'Conseil municipal', 'Permanence']) {
    assert.match(view.text(), new RegExp(expected), `${expected} is rendered`);
  }
  assert.deepEqual(view.props('DashboardRecentProjects').projects.map((project) => project.status), ['in-progress', 'completed']);
  assert.equal(view.find('DashboardQuickActions').length, 0);
  assert.match(view.text(), /01\/12\/2026/);
  assert.match(view.text(), /30\/06\/2026/);
  assert.match(view.text(), /01\/11\/2026/);
  assert.match(view.text(), /Sans échéance/);
});

test('the account-menu logout hands off to Login without another BFF call', async () => {
  const destinations = [];
  global.window.location.replace = (href) => destinations.push(href);
  await renderLoadedPage();
  // MAIR-919: the lib Header confirms first (confirmLogout left to its default), and the
  // returned promise keeps « Se déconnecter » loading until Login opens.
  assert.notEqual(view.props('AppShell').headerProps?.confirmLogout, false);
  let pending;
  await view.act(() => { pending = view.props('AppShell').onLogout(); return pending; });
  assert.ok(pending instanceof Promise);

  assert.deepEqual(destinations, ['https://login.test.example/logout']);
  assert.deepEqual(front.calls.map(({ side, method, url }) => `${side} ${method} ${url.pathname}`), [
    'browser GET /dashboard/bootstrap',
    'server GET /dashboard/bootstrap',
  ]);
  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap']);
});

test('unrecognized project/task deadlines stay verbatim rather than becoming invented calendar days', async () => {
  const body = bootstrapResponse();
  body.projects[0].dueDate = '3';
  body.tasks[0].dueDate = '2026-02-31';
  await renderLoadedPage(body);
  assert.equal(view.props('DashboardRecentProjects').projects[0].dueDate, '3');
  assert.equal(view.props('DashboardPendingTasks').tasks[0].dueLabel, '2026-02-31');
  assert.doesNotMatch(view.text(), /2001|03\/03\/2026/);
  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap']);
});

test('partially unusable event dates retain only valid returned events and offer read-only recovery', async () => {
  await renderLoadedPage(bootstrapResponse({ events: [
    { id: 'bad', title: 'Impossible calendar date', date: '2026-02-31', startTime: '09:00' },
    { id: 'good', title: 'Returned leap day', date: '2028-02-29', startTime: '09:00' },
  ] }));
  assert.deepEqual(view.props('DashboardUpcomingEvents').events.map(event => event.id), ['good']);
  assert.match(view.text(), /Certains événements reçus ont une date ou une heure illisible/);
  assert.doesNotMatch(view.text(), /Impossible calendar date/);
  // The server-view collector can revisit a shared host node; count real rendered controls.
  // MAIR-608: the lib RetryButton carries its icon before the label.
  assert.equal((view.html.match(/<button\b[^>]*>(?:<svg\b[^]*?<\/svg>)?Actualiser les dates illisibles<\/button>/g) ?? []).length, 1);
  assert.match(view.text(), /Budget participatif/);
  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap']);
});

test('all unusable event dates are not a confirmed empty result and an explicit GET can recover them', async () => {
  await renderLoadedPage(bootstrapResponse({ events: [
    { id: 'bad', title: 'Unusable event date', date: '2026-02-31', startTime: '09:00' },
  ] }));
  assert.match(view.text(), /Les événements reçus ne peuvent pas être affichés/);
  assert.doesNotMatch(view.text(), /Aucun événement à venir|Unusable event date/);
  assert.equal(view.find('DashboardUpcomingEvents').length, 0);
  dashboardBff.on('get', '/dashboard/bootstrap', { body: bootstrapResponse() });
  await view.fire((_props, text, tag) => tag === 'button' && text === 'Actualiser les dates illisibles', 'onClick');
  await view.waitFor(html => html.includes('Conseil municipal'));
  assert.doesNotMatch(view.text(), /date ou une heure illisible|Les événements reçus ne peuvent pas être affichés/);
  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap', 'GET /dashboard/bootstrap']);
  assert.equal(view.props('DashboardUpcomingEvents').events.length, 2);
});

test('confirmed empty event dates keep the existing empty label without a date-recovery warning', async () => {
  await renderLoadedPage(bootstrapResponse({ events: [] }));
  assert.match(view.text(), /Aucun événement à venir/);
  assert.doesNotMatch(view.text(), /date ou une heure illisible|Actualiser les dates illisibles/);
});

test('an unavailable source is announced above the real sections', async () => {
  const html = await renderLoadedPage(bootstrapResponse({ sources: { projects: 'available', tasks: 'unavailable', calendar: 'available' } }));

  // MAIR-915: a lib WarningAlert (role status), size m, not dismissible.
  assert.match(html, /role="status" data-tone="warning" data-size="m"[^]*?Certaines données sont temporairement indisponibles\./);
  assert.match(view.text(), /Budget participatif/);
});

test('the shared sidebar opens the configured Settings front without exposing an unknown admin role', async () => {
  const assigned = [];
  global.window.location.assign = (href) => assigned.push(href);
  const html = await renderLoadedPage();
  const navigation = view.props('DesktopNavigation');

  assert.equal(navigation.isAdmin, false);
  assert.doesNotMatch(html, />Administration</);
  // MAIR-1106: Agent entries, « E-learning » instead of « Formation », no Workflows.
  assert.deepEqual(navigation.sidebarProps.items.map((item) => item.label), ['Tableau de bord', 'Projets', 'Messagerie', 'E-learning', 'Calendrier', 'Administration', 'Paramètres']);
  assert.doesNotMatch(html, />Formation<|Workflows/);
  // MAIR-883 / MAIR-1223: the commune of the bootstrap through the shell's single `commune` prop, shown by the shared
  // header and navigation, never the lib's placeholder name.
  assert.equal(view.props('AppShell').commune, 'Saint-Pierre');
  assert.equal(view.props('Header').commune, 'Saint-Pierre');
  assert.equal(navigation.sidebarProps.brandLabel, 'Saint-Pierre');
  assert.doesNotMatch(html, /Saint-André/);
  await view.click((_props, text, tag) => tag === 'button' && /Paramètres/.test(text));
  assert.deepEqual(assigned, ['https://settings.test.example/']);
});

test('empty BFF collections stay empty instead of showing library fixtures', async () => {
  const html = await renderLoadedPage(bootstrapResponse({ projects: [], tasks: [], events: [], metrics: { totalProjects: 0, eventsThisMonth: 0, eventsPeriod: { from: '2026-09-01', to: '2026-09-30' } } }));

  assert.match(html, /Aucun projet récent\./);
  assert.match(html, /Aucune tâche en attente\./);
  assert.match(html, /Aucun événement à venir\./);
  assert.doesNotMatch(html, /Actions rapides|Voir les rapports|Budget participatif|Conseil municipal/);
});

test('a BFF error is rendered as an alert and the dashboard stays unavailable', async () => {
  dashboardBff.on('get', '/dashboard/bootstrap', { status: 502, body: { error: { message: 'BFF Project injoignable' } }, outOfContract: true });
  view = mount(React.createElement(Home));

  const html = await view.waitFor((current) => current.includes('role="alert" data-tone="danger"'));

  // MAIR-915: a fixed lib ErrorAlert and an error DataState; the service message never reaches the agent.
  assert.match(html, /role="alert" data-tone="danger"[^]*?Le tableau de bord est temporairement indisponible\./);
  assert.doesNotMatch(html, /BFF Project injoignable|502/);
  assert.match(html, /data-state="error"[^]*?Le tableau de bord est indisponible\.[^]*?Vos projets, tâches et événements s’afficheront|data-state="error"[^]*?Le tableau de bord est indisponible\./);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal(view.find('DashboardRecentProjects').length, 0);
});

test('an unreachable proxy target becomes the controlled error of the page', async () => {
  const closed = await require('./support/contract-mock-server.ts').unreachableUrl();
  front.allow(closed);
  process.env.DASHBOARD_BFF_URL = closed;
  try {
    view = mount(React.createElement(Home));
    const html = await view.waitFor((current) => current.includes('role="alert" data-tone="danger"'));
    assert.match(html, /role="alert" data-tone="danger"[^]*?Le tableau de bord est temporairement indisponible\./);
    assert.deepEqual(upstreamCalls(), []);
  } finally {
    process.env.DASHBOARD_BFF_URL = dashboardBff.url;
  }
});

test('an initial refusal offers explicit recovery using only the published bootstrap GET', async () => {
  dashboardBff.on('get', '/dashboard/bootstrap', { status: 503, body: { error: { message: 'Chargement refusé' } }, outOfContract: true });
  view = mount(React.createElement(Home));
  await view.waitFor((html) => html.includes('role="alert" data-tone="danger"'));
  assert.equal(view.html.match(/>Réessayer le chargement<\/button>/g)?.length, 1);
  assert.equal(dashboardBff.requests.length, 1, 'there is no automatic retry');
  dashboardBff.on('get', '/dashboard/bootstrap', { body: bootstrapResponse() });
  await view.click((props, text, tag) => tag === 'button' && text === 'Réessayer le chargement');
  await view.waitFor((html) => html.includes('Budget participatif') && !html.includes('role="alert" data-tone="danger"'));
  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap', 'GET /dashboard/bootstrap']);
  assert.doesNotMatch(view.html, /Réessayer le chargement|Actualiser les données indisponibles|Actions rapides/);
});

test('partial data stays visible through a refused recovery and a later complete response replaces it', async () => {
  await renderLoadedPage(bootstrapResponse({ events: [], sources: { projects: 'available', tasks: 'available', calendar: 'unavailable' } }));
  dashboardBff.on('get', '/dashboard/bootstrap', { status: 503, body: { error: { message: 'Actualisation refusée' } }, outOfContract: true });
  await view.click((props, text, tag) => tag === 'button' && text === 'Actualiser les données indisponibles');
  await view.waitFor((html) => html.includes('role="alert" data-tone="danger"'));
  assert.doesNotMatch(view.html, /Actualisation refusée/, 'the service message never reaches the agent (MAIR-915)');
  assert.match(view.text(), /Budget participatif/);
  assert.match(view.text(), /Les dernières données reçues restent affichées/);
  assert.match(view.text(), /Certaines données sont temporairement indisponibles/);
  // MAIR-915 (F2): the refused refresh is announced by an error toast.
  assert.match(view.text(), /Le tableau de bord est toujours indisponible/);
  dashboardBff.on('get', '/dashboard/bootstrap', { body: bootstrapResponse({ projects: [] }) });
  await view.click((props, text, tag) => tag === 'button' && text === 'Réessayer le chargement');
  await view.waitFor((html) => html.includes('Conseil municipal') && !html.includes('role="alert" data-tone="danger"'));
  assert.match(view.text(), /Tableau de bord à jour/);
  assert.match(view.text(), /Toutes les données ont été récupérées\./);
  assert.match(view.text(), /Aucun projet récent/);
  assert.doesNotMatch(view.text(), /Budget participatif|indisponibles|Actualisation refusée/);
  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap', 'GET /dashboard/bootstrap', 'GET /dashboard/bootstrap']);
});

test('composed read recovery replaces retained cards only after confirmed empty bootstrap', async () => {
  dashboardBff.on('get', '/dashboard/bootstrap', { status: 503, body: { error: { message: 'Lecture initiale refusée' } }, outOfContract: true });
  view = mount(React.createElement(Home));
  await view.waitFor((html) => html.includes('role="alert" data-tone="danger"'));
  assert.equal(upstreamCalls().length, 1);
  dashboardBff.on('get', '/dashboard/bootstrap', { body: bootstrapResponse({ events: [], sources: { projects: 'available', tasks: 'available', calendar: 'unavailable' } }) });
  await view.click((props, text, tag) => tag === 'button' && text === 'Réessayer le chargement');
  await view.waitFor((html) => html.includes('Budget participatif'));
  dashboardBff.on('get', '/dashboard/bootstrap', { status: 503, body: { error: { message: 'Nouvelle lecture refusée' } }, outOfContract: true });
  await view.click((props, text, tag) => tag === 'button' && text === 'Actualiser les données indisponibles');
  await view.waitFor((html) => html.includes('role="alert" data-tone="danger"'));
  assert.match(view.text(), /Budget participatif|Les dernières données reçues restent affichées/);
  await view.act(() => view.props('DashboardPendingTasks').onSelect(view.props('DashboardPendingTasks').tasks[0]));
  assert.equal(window.location.href, 'https://project.test.example/?project=project-42&task=task-2');
  assert.equal(upstreamCalls().length, 3, 'retained card navigation is not a retry');
  dashboardBff.on('get', '/dashboard/bootstrap', { body: bootstrapResponse({ projects: [], tasks: [], events: [], userFirstName: 'Confirmé', metrics: { totalProjects: 0, eventsThisMonth: 0, eventsPeriod: { from: '2026-09-01', to: '2026-09-30' } } }) });
  await view.click((props, text, tag) => tag === 'button' && text === 'Réessayer le chargement');
  await view.waitFor((html) => /Bon(?:jour|soir) Confirmé/.test(html) && !html.includes('role="alert" data-tone="danger"'));
  for (const text of ['Aucun projet récent', 'Aucune tâche en attente', 'Aucun événement à venir']) assert.ok(view.text().includes(text));
  assert.doesNotMatch(view.html, /Budget participatif|Nouvelle lecture refusée|Actualiser les données indisponibles|Réessayer le chargement/);
  assert.deepEqual(upstreamCalls(), Array(4).fill('GET /dashboard/bootstrap'));
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

// Configuration faults only: valid, schema-checked card data and the real proxy are unchanged.
const cardNavigationActions = [
  ['projects view all', () => view.props('DashboardRecentProjects').onViewAll()],
  ['tasks view all', () => view.props('DashboardPendingTasks').onViewAll()],
  ['calendar view all', () => view.props('DashboardUpcomingEvents').onOpenCalendar()],
  ['project selection', () => {
    const section = view.props('DashboardRecentProjects');
    section.onSelect(section.projects[0]);
  }],
  ['task selection', () => {
    const section = view.props('DashboardPendingTasks');
    section.onSelect(section.tasks[0]);
  }],
  ['event selection', () => {
    const section = view.props('DashboardUpcomingEvents');
    section.onSelect(section.events[0]);
  }],
];

for (const [fault, destination] of [
  ['blank', '   '], ['malformed', 'not-an-absolute-url'], ['unsupported protocol', 'ftp://front.example.test/'],
]) {
  for (const [actionName, action] of cardNavigationActions) {
    test(`card destination validation refuses ${fault} configuration for ${actionName}`, async () => {
      setBrowserFrontUrls({ PROJECT_FRONT_URL: destination, CALENDAR_FRONT_URL: destination });
      await renderLoadedPage();

      await view.act(action);

      assert.equal(window.location.href, '', 'an invalid destination behaves like missing configuration');
      assert.match(view.text(), /Budget participatif/);
      assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap'], 'invalid navigation does not replay a read or mutation');
    });
  }
}

test('card destination validation uses the latest normalized runtime URL without changing query values or identifiers', async () => {
  await renderLoadedPage();
  setBrowserFrontUrls({
    PROJECT_FRONT_URL: '  https://project.test.example/?source=dashboard  ',
    CALENDAR_FRONT_URL: '  https://calendar.test.example/?source=dashboard  ',
  });
  await view.act(() => view.props('DashboardRecentProjects').onViewAll());
  assert.equal(window.location.href, 'https://project.test.example/?source=dashboard');
  await view.act(() => {
    const section = view.props('DashboardPendingTasks');
    section.onSelect(section.tasks[0]);
  });
  let destination = new URL(window.location.href);
  assert.equal(destination.searchParams.get('source'), 'dashboard');
  assert.equal(destination.searchParams.get('project'), 'project-42');
  assert.equal(destination.searchParams.get('task'), 'task-2');
  await view.act(() => view.props('DashboardUpcomingEvents').onOpenCalendar());
  assert.equal(window.location.href, 'https://calendar.test.example/?source=dashboard');
  await view.act(() => {
    const section = view.props('DashboardUpcomingEvents');
    section.onSelect(section.events[0]);
  });
  destination = new URL(window.location.href);
  assert.equal(destination.searchParams.get('source'), 'dashboard');
  assert.equal(destination.searchParams.get('date'), '2026-09-18');
  assert.equal(destination.searchParams.get('event'), '9');
  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap']);
});

test('MAIR-889: the user menu gets the full name and the role of the bootstrap', async () => {
  await renderLoadedPage();
  assert.deepEqual(view.props('AppShell').user, { first_name: 'Alice', last_name: 'Martin', name: 'Alice Martin', role: 'Agent' });
});

test('MAIR-889 / MAIR-883: without role nor commune, no empty label and no placeholder commune', async () => {
  await renderLoadedPage(bootstrapResponse({ userLastName: '', userRole: null, communeName: null }));
  assert.deepEqual(view.props('AppShell').user, { first_name: 'Alice' });
  assert.equal(view.props('AppShell').commune, undefined);
  assert.equal(view.props('Header').showCommune, false);
  assert.equal(view.props('DesktopNavigation').sidebarProps.brandLabel, undefined);
  assert.doesNotMatch(view.html, /Saint-André|Commune de/);
});

test('MAIR-1110: « Mes formations » lists the trainings and opens them in the E-learning front', async () => {
  setBrowserFrontUrls({ ELEARNING_FRONT_URL: 'https://elearning.test.example/?source=dashboard' });
  await renderLoadedPage();
  assert.match(view.text(), /Mes formations[^]*Accueil du public[^]*Module 3 sur 5[^]*Protection des données/);
  const trainings = view.props('DashboardTrainings');
  await view.act(() => trainings.onSelect(trainings.trainings[0]));
  assert.equal(window.location.href, 'https://elearning.test.example/?source=dashboard&course=4');
  await view.act(() => trainings.onViewAll());
  assert.equal(window.location.href, 'https://elearning.test.example/?source=dashboard');
  assert.deepEqual(upstreamCalls(), ['GET /dashboard/bootstrap']);
});

test('MAIR-1110: unavailable trainings show their own state without the page banner', async () => {
  await renderLoadedPage(bootstrapResponse({ trainings: [], sources: { projects: 'available', tasks: 'available', calendar: 'available', trainings: 'unavailable' } }));
  assert.match(view.text(), /Les formations sont temporairement indisponibles\./);
  assert.doesNotMatch(view.text(), /Certaines données sont temporairement indisponibles/);
});

test('MAIR-1110: a bare formation id opens the training too, any other id the catalogue', () => {
  setBrowserFrontUrls({ ELEARNING_FRONT_URL: 'https://elearning.test.example/' });
  const { trainingHref } = require('../src/components/DashboardPage/components/DashboardGrid/dashboard-links.ts');
  assert.equal(trainingHref('training-4'), 'https://elearning.test.example/?course=4');
  assert.equal(trainingHref('42'), 'https://elearning.test.example/?course=42');
  assert.equal(trainingHref('formation-x'), 'https://elearning.test.example/');
  setBrowserFrontUrls({});
  assert.equal(trainingHref('training-4'), undefined);
});
