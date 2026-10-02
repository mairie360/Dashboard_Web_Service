const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const css = readFileSync(path.join(__dirname, '../src/app/globals.css'), 'utf8');

test('Dashboard uses the rendered prototype default scale and system font without global small-text or fixed-header overrides', () => {
  assert.match(css, /html\s*\{\s*font-size: 17px;/);
  assert.match(css, /@theme inline\s*\{[^}]*--font-sans: system-ui, sans-serif;/);
  assert.match(css, /body\s*\{[^}]*font-family: system-ui, sans-serif;/);
  assert.doesNotMatch(css, /--text-(?:xs|sm)\s*:/);
  assert.doesNotMatch(css, /(?:header|\.h-16)\s*\{[^}]*(?:height|min-height|max-height):/);
});
