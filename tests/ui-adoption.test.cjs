const assert = require('node:assert/strict');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
require('./support/load-ts.cjs');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const DashboardPanel = require('../src/components/DashboardPage/components/DashboardGrid/components/DashboardPanel/index.ts').default;

for (const [unavailable, message] of [
  [false, 'Aucun projet récent.'],
  [true, 'Les projets sont temporairement indisponibles.'],
]) test(`an empty projects panel names its ${unavailable ? 'unavailable source' : 'confirmed empty result'} and retains its configured destination`, () => {
  const html = renderToStaticMarkup(React.createElement(DashboardPanel, {
    title: 'Projets récents', action: 'Voir les projets', href: 'https://projects.example/',
    kind: 'projects', empty: true, unavailable,
  }));
  const dom = new JSDOM(html);
  try {
    const document = dom.window.document;
    const emptySection = [...document.querySelectorAll('section[aria-labelledby]')]
      .find(node => document.getElementById(node.getAttribute('aria-labelledby'))?.textContent === message);
    assert.ok(emptySection, 'An empty or unavailable source has its own accessible name.');
    assert.equal(document.querySelector('a')?.href, 'https://projects.example/');
    assert.equal(document.querySelectorAll('a').length, 1, 'The contextual destination is rendered once.');
    assert.equal(document.querySelectorAll('h2').length, 1, 'The panel heading is rendered once.');
    assert.equal(emptySection.querySelectorAll('svg:not([aria-hidden="true"])').length, 0);
    if (unavailable) assert.ok(!document.body.textContent.includes('Aucun projet récent.'), 'A failed read cannot claim confirmed emptiness.');
  } finally { dom.window.close(); }
});
