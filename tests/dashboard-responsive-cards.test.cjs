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
      if (selectors.includes('.dashboard-content-grid > section > div:last-child > button .truncate')) {
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
      if (condition && selectors.includes('.dashboard-upcoming-events-grid > div:last-child')) {
        const columns = rule.style.getPropertyValue('grid-template-columns');
        if (!columns) continue;
        const repeat = columns.match(/^repeat\(\s*(\d+)\s*,\s*minmax\(\s*0(?:px)?\s*,\s*1fr\s*\)\s*\)$/);
        assert.ok(repeat, 'Keep bounded responsive event tracks');
        grids.push({ condition: condition.replace(/\s+/g, ''), columns: Number(repeat[1]) });
      }
    }
  }
  visit(window.document.styleSheets[0].cssRules);
  assert.equal(titleFallbackChecked, true, 'Retain the consumer fallback for truncated title markup');
  assert.deepEqual(grids, [
    { condition: '(min-width:48rem)', columns: 2 },
    { condition: '(min-width:96rem)', columns: 3 },
  ]);
  // CSSOM policy inspection does not execute media queries or prove layout.
});
