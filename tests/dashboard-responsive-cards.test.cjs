const assert = require('node:assert/strict');
const { test } = require('node:test');
const { referenceDocument } = require('./support/document-styles.cjs');

test('Dashboard retains parsed responsive grid and surface safety policies', (t) => {
  const window = referenceDocument(t);
  const grids = [];
  let titleFallbackChecked = false;
  function visit(rules, condition) {
    for (const rule of rules) {
      if (rule.cssRules) visit(rule.cssRules, rule.conditionText || condition);
      if (!rule.style) continue;
      const selectors = (rule.selectorText || '').split(',').map((value) => value.replace(/\s*>\s*/g, ' > ').replace(/\s+/g, ' ').trim());
      if (selectors.includes('.dashboard-rows > button .truncate')) {
        assert.equal(rule.style.getPropertyValue('white-space'), 'normal');
        assert.equal(rule.style.getPropertyValue('overflow'), 'visible');
        assert.equal(rule.style.getPropertyValue('text-overflow'), 'clip');
        titleFallbackChecked = true;
      }
      for (let index = 0; index < rule.style.length; index += 1) {
        const property = rule.style.item(index);
        const value = rule.style.getPropertyValue(property).trim();
        if (property === 'overflow-x') assert.equal(['hidden', 'clip'].includes(value), false, 'Do not conceal horizontal overflow');
        if (selectors.includes('.dashboard-app-shell main')) {
          assert.equal(property.startsWith('margin') || property.startsWith('overflow') || property.endsWith('height') || ['transform', 'position', 'z-index', 'box-shadow'].includes(property), false, 'Keep the main surface and inset without extra geometry or stacking');
        }
      }
      assert.equal(selectors.some((selector) => selector.split(/\s+/).includes('.dashboard-app-shell') && selector.split(/\s+/).includes('header')), false, 'Preserve the shared header stacking');
      if (selectors.includes('.dashboard-tiles')) {
        const columns = rule.style.getPropertyValue('grid-template-columns');
        if (!columns) continue;
        const repeat = columns.match(/^(?:repeat\(\s*(\d+)\s*,\s*)?minmax\(\s*0(?:px)?\s*,\s*1fr\s*\)\s*\)?$/);
        assert.ok(repeat, 'Keep bounded responsive tile tracks');
        grids.push({ condition: (condition || 'all').replace(/\s+/g, ''), columns: Number(repeat[1] || 1) });
      }
    }
  }
  visit(window.document.styleSheets[0].cssRules);
  assert.equal(titleFallbackChecked, true, 'Retain the consumer fallback for truncated title markup');
  // MAIR-1107: one column of tiles on mobile, a 2 x 2 grid from 900 px.
  assert.deepEqual(grids, [
    { condition: 'all', columns: 1 },
    { condition: '(min-width:900px)', columns: 2 },
  ]);
  // CSSOM policy inspection does not execute media queries or prove layout.
});
