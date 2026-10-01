const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const css = readFileSync(path.join(__dirname, '../src/app/globals.css'), 'utf8');
const rule = (selector) => {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `missing scoped rule: ${selector}`);
  return css.slice(start, css.indexOf('}', start) + 1);
};

// Structural guard only: browser QA must also measure main, not just document.
test('Dashboard cards shrink, wrap long content and retain usable heading actions', () => {
  assert.match(rule('.dashboard-content-grid > section'), /min-width:\s*0/);
  assert.match(rule('.dashboard-content-grid > section > div:first-child > button'), /flex-shrink:\s*0/);
  assert.match(rule('.dashboard-content-grid > section > div:last-child > button'), /overflow-wrap:\s*anywhere/);
  assert.match(rule('.dashboard-content-grid > section > div:last-child > button .truncate'), /white-space:\s*normal/);
  assert.doesNotMatch(css, /overflow-x:\s*(hidden|clip)/);
});

test('reference project boundaries, shadows and row wrapping are scoped to Dashboard', () => {
  assert.match(rule('.dashboard-content-grid > section'), /box-shadow:\s*0 5px 15px/);
  const project = rule('.dashboard-recent-projects > div:last-child > button');
  assert.match(project, /border:\s*1px solid #d8d2ca/);
  assert.match(project, /padding:\s*12px/);
  assert.match(rule('.dashboard-recent-projects > div:last-child > button > span.flex'), /flex-wrap:\s*wrap/);
  assert.match(css, /@media \(min-width: 48rem\)/);
  assert.match(css, /@media \(min-width: 96rem\)/);
  assert.match(css, /repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /repeat\(3, minmax\(0, 1fr\)\)/);
});
