import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { defaultSidebarItems } from '@mairie360/lib-components/shell';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/components/DashboardPage';

const getDashboardBootstrap = vi.hoisted(() => vi.fn());
vi.mock('@/lib/bff-client', () => ({ bffDashboard: { getDashboardBootstrap: async (options) => ({ data: await getDashboardBootstrap(options) }) } }));
vi.mock('@/lib/front-urls', () => ({ frontUrl: vi.fn((key) => `https://${key.toLowerCase()}.example/`) }));

const require = createRequire(import.meta.url);
const stylesheet = readFileSync(require.resolve('@mairie360/lib-components/styles.css'), 'utf8') + '\n' + readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
const longTitle = 'DashboardTitleWithoutSpaces'.repeat(12);
let style;

beforeEach(() => {
  style = document.createElement('style');
  style.textContent = stylesheet;
  document.head.append(style);
  vi.mocked(getDashboardBootstrap).mockResolvedValue({
    userFirstName: 'Test',
    projects: [{ id: 'project-1', title: longTitle, progress: 25, status: 'review', dueDate: '2026-09-20' }],
    tasks: [{ id: 'task-1', title: longTitle, dueDate: '2026-09-21', priority: 'high', completed: false, projectId: 'project-1' }],
    events: [{ id: 1, title: longTitle, date: '2026-09-22', startTime: '10:00', location: longTitle }],
    metrics: { totalProjects: 1 },
    sources: { projects: 'available', tasks: 'available', calendar: 'available' },
  });
});
afterEach(() => style.remove());

async function openDashboard() {
  render(<Home />);
  // MAIR-899: the tiles are drawn while loading; wait for their skeleton rows to give way to the data.
  await waitFor(() => expect(document.querySelector('[data-skeleton]')).toBeNull());
  return screen.getByRole('heading', { name: /^Bon(?:jour|soir)/ });
}

function shadow(value) {
  value = value.replace(/var\((--[\w-]+)\)/g, (_match, name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  // Normalize computed shadow colors; this never searches stylesheet source.
  return value.split(/,(?![^()]*\))/).map((part) => {
    const pieces = part.trim().split(/\s+(?![^()]*\))/);
    const pixels = (token) => {
      const number = Number.parseFloat(token);
      expect(Number.isFinite(number) && (number === 0 || token.endsWith('px'))).toBe(true);
      return number;
    };
    const lengthTokens = pieces.filter((token) => Number.isFinite(Number.parseFloat(token)));
    const colors = pieces.filter((token) => !Number.isFinite(Number.parseFloat(token)));
    expect([3, 4]).toContain(lengthTokens.length);
    expect(colors).toHaveLength(1);
    const lengths = lengthTokens.map(pixels);
    if (lengths.length === 3) lengths.push(0);
    const color = document.createElement('span');
    color.style.color = colors[0];
    document.body.append(color);
    try {
      return { lengths, color: getComputedStyle(color).color };
    } finally {
      color.remove();
    }
  });
}

describe('Dashboard styles on the actual page and published components', () => {
  it('styles long DTO cards and preserves their heading actions and reference project rows', async () => {
    await openDashboard();
    const cards = ['Projets récents', 'Tâches en attente', 'Événements à venir']
      .map((name) => screen.getByRole('heading', { name: new RegExp(`^${name}`) }).closest('section'));
    for (const card of cards) {
      expect(Number.parseFloat(getComputedStyle(card).minWidth)).toBe(0);
      expect(shadow(getComputedStyle(card).boxShadow)).toEqual([
        { lengths: [0, 2, 12, 0], color: 'rgba(23, 32, 51, 0.05)' },
      ]);
      const action = within(card).getByRole('link', { name: /Voir les projets|Voir les tâches|Ouvrir le calendrier/ });
      expect(getComputedStyle(action).flexShrink).toBe('0');
      const item = within(card).getByRole('button', { name: new RegExp(longTitle) });
      expect(getComputedStyle(item).overflowWrap).toBe('anywhere');
      const title = within(item).getAllByText(longTitle)[0];
      // JSDOM can omit initial values on the published non-truncated title markup.
      const titleStyle = getComputedStyle(title);
      expect(titleStyle.whiteSpace || 'normal').toBe('normal');
      expect(titleStyle.overflow || 'visible').toBe('visible');
      expect(titleStyle.textOverflow || 'clip').toBe('clip');
    }
    const project = within(cards[0]).getByRole('button', { name: new RegExp(longTitle) });
    const computed = getComputedStyle(project);
    // MAIR-907 compact row: no frame, a rule under the row, 10 px inset; the rule is the --mairie-border token.
    expect(computed.borderTopWidth).toBe('0px');
    expect(computed.borderBottomStyle).toBe('solid');
    expect(stylesheet).toMatch(/\.dashboard-row \{[^}]*border-color: var\(--mairie-border\)/);
    expect(stylesheet).toMatch(/\.dashboard-rows > \.dashboard-row:last-child \{ border-bottom-width: 0; \}/);
    expect(computed.padding).toBe('10px');
    expect(getComputedStyle(project.querySelector('.dashboard-row-line')).flexWrap).toBe('wrap');
    expect(getDashboardBootstrap).toHaveBeenCalledTimes(1);
  });

  it('MAIR-1223 applies the mockup inset and opaque main surface to the page actually mounted in the shell', async () => {
    const heading = await openDashboard();
    const main = heading.closest('main');
    expect(main).not.toBeNull();
    const computed = getComputedStyle(main);
    // 24 px from the sides, 16 px above the bottom; the welcome's 28 px margin is the gap under the header.
    expect([computed.paddingTop, computed.paddingRight, computed.paddingBottom, computed.paddingLeft]).toEqual(['0px', '24px', '16px', '24px']);
    // MAIR-1106: no footer on the lib 2.3 page base.
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });

  it('applies reference position, shadow and row rhythm to the real six-entry sidebar', async () => {
    await openDashboard();
    // lib-components 2.x: the desktop navigation is the DesktopNavigation aside (hidden until its media query matches in jsdom).
    const sidebar = document.querySelector('aside.app-desktop-navigation[aria-label="Navigation principale"]');
    expect(sidebar).not.toBeNull();
    const computed = getComputedStyle(sidebar);
    expect(computed.position).toBe('relative');
    expect(computed.zIndex).toBe('20');
    // lib-components 2.x: the white navigation has no lateral shadow (--mairie-navigation-shadow: none).
    expect(getComputedStyle(document.documentElement).getPropertyValue('--mairie-navigation-shadow').trim() || computed.boxShadow).toMatch(/none|var\(--mairie-navigation-shadow\)/);
    const buttons = within(sidebar).getAllByRole('button', { hidden: true });
    expect(buttons.map((button) => button.textContent)).toEqual(defaultSidebarItems
      .filter(({ label }) => label !== 'Administration').map(({ label }) => label === 'Formation' ? 'E-learning' : label)); // MAIR-1106
    for (const button of buttons) {
      expect(getComputedStyle(button).minHeight).toBe('42px');
      expect(getComputedStyle(button).flexShrink).toBe('0');
    }
  });

  it('opens the published drawer with its lower sidebar layer and closes it through its actual command', async () => {
    const user = userEvent.setup();
    await openDashboard();
    await user.click(screen.getByRole('button', { name: 'Ouvrir la navigation', exact: true }));
    const drawer = screen.getByRole('dialog', { name: 'Navigation mobile' });
    const sidebar = within(drawer).getByRole('complementary', { name: 'Navigation principale' });
    expect(getComputedStyle(sidebar).zIndex).toBe('0');
    await user.click(within(drawer).getByRole('button', { name: 'Fermer la navigation', exact: true }));
    expect(screen.queryByRole('dialog', { name: 'Navigation mobile' })).toBeNull();
  });
});
