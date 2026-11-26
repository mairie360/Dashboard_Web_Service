const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const css = readFileSync(join(__dirname, '..', 'src', 'app', 'globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = (selector) => [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  .filter(([, selectors]) => selectors.split(',').some((part) => part.trim() === selector))
  .map(([, , body]) => body);

test('MAIR-1223 the content keeps the mockup spacing inside the collapsible shell of lib 2.5', () => {
  const main = rules('.dashboard-app-shell main').join(';');
  // 24 px from the sides, 16 px above the bottom; the welcome's 28 px margin is the gap under the header.
  assert.match(main, /padding:\s*0 24px 16px/);
  assert.doesNotMatch(main, /padding-block/);
  assert.match(rules('.dashboard-welcome').join(';'), /margin-top:\s*28px/);
});
