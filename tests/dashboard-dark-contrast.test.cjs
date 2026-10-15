const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { JSDOM } = require('jsdom');

const root = resolve(__dirname, '..');
const markup = `<body class="mairie-ui"><aside aria-label="Navigation principale"><nav><button id="navigation" class="bg-[#155bb5] text-white">Tableau de bord</button></nav></aside><div class="dashboard-app-shell"><main>
<div class="page-title-row"><div><h1>Tableau de bord</h1></div><span id="date" class="page-current-date">Jeudi 15 octobre 2026</span></div>
<section class="dashboard-panel"><header><a id="projects-link" class="dashboard-panel-action" href="/projects">Voir les projets</a></header><div class="dashboard-panel-content">
<section class="dashboard-recent-projects rounded-lg border border-[#dfd9d1] bg-white p-6"><div></div><div class="mt-6 space-y-4"><button id="budget" class="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155bb5]/30 disabled:cursor-default"><span class="flex items-center justify-between gap-4"><span id="budget-title" class="font-semibold text-[#172033]">Budget participatif</span><span id="status" class="rounded-md px-2.5 py-1 text-xs font-semibold bg-[#155bb5] text-white">En cours</span></span><span id="budget-metadata" class="mt-2 flex items-center justify-between gap-4 text-sm text-[#687385]">Progression: 50%</span></button></div></section>
<section class="dashboard-pending-tasks"><div></div><div><button id="task" class="flex w-full items-center gap-3 rounded-md border border-[#e5e0da] bg-[#fbfaf9] px-3 py-3 text-left transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155bb5]/30 disabled:cursor-default"><span id="task-title" class="block truncate font-semibold text-[#243041]">Validation</span><span id="task-date" class="block text-sm text-[#687385]">Échéance: 01/11/2026</span><span id="high" class="rounded-md px-2.5 py-1 text-xs font-medium bg-[#fee2e2] text-[#dc2626]">Haute</span><span id="medium" class="rounded-md px-2.5 py-1 text-xs font-medium bg-[#ffedd5] text-[#c2410c]">Moyenne</span><span id="low" class="rounded-md px-2.5 py-1 text-xs font-medium bg-[#dcfce7] text-[#15803d]">Basse</span></button></div></section>
</div></section><button id="primary" class="bg-[#155bb5] text-white">Créer un projet</button>
</main></div></body>`;

async function screen(theme) {
  const { compile } = await import('tailwindcss');
  const globals = readFileSync(resolve(root, 'src/app/globals.css'), 'utf8').replace(/^@import\s+"tailwindcss";$/m, '@tailwind utilities;');
  const municipal = readFileSync(resolve(root, 'src/app/municipal-theme.css'), 'utf8');
  const dom = new JSDOM(`<html data-theme="${theme}"><head></head>${markup}</html>`);
  const classes = [...dom.window.document.querySelectorAll('[class]')].flatMap(element => [...element.classList]);
  const style = dom.window.document.createElement('style');
  style.textContent = (await compile(`${globals}\n${municipal}`)).build(classes);
  dom.window.document.head.append(style);
  const computed = element => dom.window.getComputedStyle(element);
  // JSDOM drops shorthand backgrounds containing var(), unlike browsers.
  // Resolve only the actual active colour tokens before applying its cascade.
  for (const [prefix, element] of [['mairie', dom.window.document.documentElement], ['dashboard', dom.window.document.querySelector('.dashboard-app-shell')]]) {
    const tokens = computed(element);
    style.textContent = style.textContent.replace(new RegExp(`var\\((--${prefix}-[\\w-]+)\\)`, 'g'), (match, name) => {
      const value = tokens.getPropertyValue(name).trim();
      return /^#[\da-f]{6}$/i.test(value) ? value : match;
    });
  }
  const variable = (element, name) => {
    for (let current = element; current; current = current.parentElement) {
      const value = computed(current).getPropertyValue(name).trim();
      if (value) return value;
    }
    return '';
  };
  const colour = (value, element) => {
    for (let pass = 0; pass < 10 && value.includes('var('); ++pass) value = value.replace(/var\((--[\w-]+)(?:,\s*([^)]*))?\)/g, (_match, name, fallback) => variable(element, name) || fallback || '');
    if (/^#[\da-f]{3}$/i.test(value)) value = '#' + [...value.slice(1)].map(char => char + char).join('');
    if (/^#[\da-f]{6}$/i.test(value)) return [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16));
    const rgb = /^rgb[a]?\((\d+)[, ]+(\d+)[, ]+(\d+)/.exec(value);
    assert.ok(rgb, `Expected an applied solid colour, received ${value}`);
    return rgb.slice(1, 4).map(Number);
  };
  const background = element => {
    for (let current = element; current; current = current.parentElement) {
      const value = computed(current).backgroundColor;
      if (value && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)') return colour(value, current);
    }
    throw new Error('No rendered background');
  };
  const luminance = channels => channels.map(channel => channel / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return {
    dom,
    colour: id => colour(computed(dom.window.document.getElementById(id)).color, dom.window.document.getElementById(id)),
    background: id => background(dom.window.document.getElementById(id)),
    contrast(id) {
      const element = dom.window.document.getElementById(id);
      const pair = [luminance(colour(computed(element).color, element)), luminance(background(element))].sort((a, b) => b - a);
      return (pair[0] + 0.05) / (pair[1] + 0.05);
    },
  };
}

for (const id of ['budget-title', 'budget-metadata', 'projects-link', 'task-title', 'task-date', 'date', 'high', 'medium', 'low']) {
  test(`dark rendered Dashboard ${id} keeps AA text contrast on its applied background`, async context => {
    const view = await screen('dark');
    try {
      const ratio = view.contrast(id);
      context.diagnostic(`${id}: text rgb(${view.colour(id)}) on rgb(${view.background(id)}), contrast ${ratio.toFixed(2)}:1`);
      assert.ok(ratio >= 4.5, `${id} contrast ${ratio.toFixed(2)} must reach 4.5`);
    }
    finally { view.dom.window.close(); }
  });
}
test('the neutral dark surface fix preserves primary, navigation and status backgrounds', async () => {
  const view = await screen('dark');
  try {
    assert.deepEqual(view.background('primary'), [21, 91, 181]);
    assert.deepEqual(view.background('status'), [21, 91, 181]);
    assert.deepEqual(view.background('navigation'), [21, 91, 181]);
    assert.ok(view.contrast('primary') >= 4.5);
  } finally { view.dom.window.close(); }
});
test('the light Dashboard retains its existing neutral card and action backgrounds', async () => {
  const view = await screen('light');
  try {
    assert.deepEqual(view.background('budget'), [248, 250, 252]);
    assert.deepEqual(view.background('projects-link'), [248, 250, 252]);
  } finally { view.dom.window.close(); }
});
