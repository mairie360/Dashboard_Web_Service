const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

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
  for (const component of ['DashboardModule', 'DashboardMetricCards', 'DashboardPendingTasks', 'DashboardPerformancePanel', 'DashboardQuickActions', 'DashboardRecentProjects', 'DashboardUpcomingEvents']) {
    assert.ok(fs.existsSync(path.join(root, 'src/components/dashboard', `${component}.tsx`)), `${component} lives in src/components/dashboard`);
    assert.match(read('src/components/dashboard/index.ts'), new RegExp(`export \\{ ${component} \\}`));
  }
  assert.match(read('src/components/dashboard-page.tsx'), /from "@\/components\/dashboard"/);
  assert.match(read('src/lib/dashboard-view.ts'), /from '@\/components\/dashboard'/);
});

test('MAIR-607 the installed library no longer publishes a dashboard entry', () => {
  const pkg = JSON.parse(read('node_modules/@mairie360/lib-components/package.json'));
  assert.equal(pkg.exports['./dashboard'], undefined, 'the installed lib-components must not expose ./dashboard (bump the pin to the MAIR-607 major)');
  assert.ok(pkg.exports['./primitives'] && pkg.exports['./shell'], 'primitives and shell entries remain');
});
