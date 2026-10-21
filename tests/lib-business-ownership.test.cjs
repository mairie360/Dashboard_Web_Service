const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
require('./support/load-ts.cjs');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);

// MAIR-607: the library keeps only components shared by several fronts. The
// dashboard module and its panels are Dashboard's own code now.
test('MAIR-607 the dashboard owns its module and panels instead of importing a library entry', () => {
  for (const file of walk(path.join(root, 'src'))) {
    if (!/\.(tsx?|mjs|cjs|js)$/.test(file)) continue;
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /@mairie360\/lib-components\/(dashboard|settings|projects|messages|calendar|admin|elearning)/, `${path.relative(root, file)} must not import a removed library entry`);
  }
  // MAIR-608: one folder per panel, split into list + row sub-components; the page is composed under page/.
  const tree = {
    'DashboardModule.tsx': 'DashboardModule',
    'metrics/DashboardMetricCards.tsx': 'DashboardMetricCards',
    'projects/DashboardRecentProjects.tsx': 'DashboardRecentProjects', 'projects/ProjectRow.tsx': 'ProjectRow',
    'tasks/DashboardPendingTasks.tsx': 'DashboardPendingTasks', 'tasks/TaskRow.tsx': 'TaskRow',
    'events/DashboardUpcomingEvents.tsx': 'DashboardUpcomingEvents', 'events/EventRow.tsx': 'EventRow', 'events/EventDateBadge.tsx': 'EventDateBadge',
    'quick-actions/DashboardQuickActions.tsx': 'DashboardQuickActions', 'quick-actions/QuickActionButton.tsx': 'QuickActionButton',
    'performance/DashboardPerformancePanel.tsx': 'DashboardPerformancePanel', 'performance/PerformanceMetric.tsx': 'PerformanceMetric',
    'panels/DashboardPanel.tsx': 'DashboardPanel', 'page/DashboardPage.tsx': 'DashboardPage', 'page/DashboardGrid.tsx': 'DashboardGrid',
    'page/DashboardHeader.tsx': 'DashboardHeader', 'page/DashboardNotices.tsx': 'DashboardNotices', 'page/DashboardLoading.tsx': 'DashboardLoading',
  };
  const index = read('src/components/dashboard/index.ts');
  for (const [file, component] of Object.entries(tree)) {
    assert.ok(fs.existsSync(path.join(root, 'src/components/dashboard', file)), `${component} lives in src/components/dashboard/${file}`);
    assert.match(index, new RegExp(`\\b${component}\\b`), `${component} is exported by the dashboard barrel`);
  }
  assert.match(read('src/components/dashboard-page.tsx'), /from "@\/components\/dashboard\/page\/DashboardPage"/);
  assert.match(read('src/lib/dashboard-view.ts'), /from '@\/components\/dashboard'/);
});

// MAIR-608: callers import the dashboard through its barrel; every re-export must resolve at runtime.
test('MAIR-608 the dashboard barrel resolves every public export at runtime', () => {
  const barrel = require('../src/components/dashboard/index.ts');
  const components = ['DashboardModule', 'DashboardMetricCards', 'DashboardPendingTasks', 'TaskRow', 'DashboardPerformancePanel',
    'PerformanceMetric', 'DashboardQuickActions', 'QuickActionButton', 'DashboardRecentProjects', 'ProjectRow',
    'DashboardUpcomingEvents', 'EventRow', 'EventDateBadge', 'DashboardPanel', 'DashboardPanelAction', 'PanelViewAll',
    'DashboardHeader', 'DashboardNotices', 'DashboardLoading', 'DashboardGrid', 'DashboardPage', 'useDashboardData'];
  const helpers = ['metricTrend', 'clampProgress', 'byStart', 'eventDateParts', 'dashboardGreeting',
    'reloadLabel', 'calendarEventHref', 'navigateTo', 'projectHref'];
  for (const name of [...components, ...helpers]) assert.equal(typeof barrel[name], 'function', `${name} is re-exported as a function`);
  for (const name of ['projectStatusBadge', 'projectStatusLabels', 'panelMessages', 'dashboardUrls']) assert.ok(barrel[name] && typeof barrel[name] === 'object', `${name} is re-exported as data`);
  assert.deepEqual(Object.keys(barrel).sort(), [...components, ...helpers, 'projectStatusBadge', 'projectStatusLabels', 'panelMessages', 'dashboardUrls'].sort(),
    'the barrel exports exactly the documented dashboard API');
});

test('MAIR-607 the installed library no longer publishes a dashboard entry', () => {
  const pkg = JSON.parse(read('node_modules/@mairie360/lib-components/package.json'));
  assert.equal(pkg.exports['./dashboard'], undefined, 'the installed lib-components must not expose ./dashboard (bump the pin to the MAIR-607 major)');
  assert.ok(pkg.exports['./primitives'] && pkg.exports['./shell'], 'primitives and shell entries remain');
});
