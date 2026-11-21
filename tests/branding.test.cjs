const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { loadRootLayout } = require('./support/root-layout.cjs');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath));

test('browser and app icons use the same Mairie360 mark', () => {
  const appleIcon = read('src/app/apple-icon.png');
  const faviconPng = read('public/mairie360-favicon.png');
  const appIcon = read('src/app/icon.png');
  const faviconIco = read('src/app/favicon.ico');

  assert.deepEqual(faviconPng, appIcon);
  assert.deepEqual(faviconIco.subarray(22), faviconPng);
  assert.equal(appleIcon.readUInt32BE(16), 192);
  assert.equal(appleIcon.readUInt32BE(20), 192);
});

test('MAIR-883: the sidebar logo comes from lib-components, no local copy is served', () => {
  assert.throws(() => read('public/mairie360-logo.png'), /ENOENT/);
  const page = read('src/components/DashboardPage/DashboardPage.tsx').toString();
  assert.doesNotMatch(page, /brandLogoSrc/);
});

test('page metadata expose the branded browser icon', async () => {
  const { metadata, default: RootLayout } = loadRootLayout(() => (() => { require('./support/load-ts.cjs'); return require('../src/app/layout.tsx'); })());
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');

  assert.equal(metadata.title, "Tableau de bord | Mairie360");
  const icon = metadata.icons.icon.find(item => new URL(item.url, 'https://frontend.test').pathname === '/mairie360-favicon.png');
  assert.ok(icon, 'metadata contains the public browser icon');
  assert.ok(new URL(icon.url, 'https://frontend.test').searchParams.get('v'), 'the icon keeps its cache key');
  // The app icon is src/app/apple-icon.png, served by the App Router file convention.
  assert.equal(metadata.icons.apple, undefined);
  const html = renderToStaticMarkup(await RootLayout({children:React.createElement('span', { id: 'branding-child' }, 'Preserved child')}));
  assert.match(html, /<span id="branding-child">Preserved child<\/span>/);
});
