import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { defaultSidebarItems } from '@mairie360/lib-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/app/page';
import { requestBff } from '@/lib/bff-client';

vi.mock('@/lib/bff-client', () => ({ requestBff: vi.fn() }));
vi.mock('@/lib/front-urls', () => ({ frontUrl: vi.fn((key) => `https://${key.toLowerCase()}.example/`) }));

const stylesheet = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
const longTitle = 'DashboardTitleWithoutSpaces'.repeat(12);
let style;

beforeEach(() => {
  style = document.createElement('style');
  style.textContent = stylesheet;
  document.head.append(style);
  vi.mocked(requestBff).mockResolvedValue({
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
  return screen.findByRole('heading', { name: 'Tableau de Bord' });
}

function shadow(value) {
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
      .map((name) => screen.getByRole('heading', { name }).closest('section'));
    for (const card of cards) {
      expect(Number.parseFloat(getComputedStyle(card).minWidth)).toBe(0);
      expect(shadow(getComputedStyle(card).boxShadow)).toEqual([
        { lengths: [0, 5, 15, 0], color: 'rgba(23, 32, 51, 0.14)' },
        { lengths: [0, 1, 3, 0], color: 'rgba(23, 32, 51, 0.12)' },
      ]);
      const action = within(card).getByRole('button', { name: 'Voir tout', exact: true });
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
    expect(computed.borderTopWidth).toBe('1px');
    expect(computed.borderTopStyle).toBe('solid');
    expect(computed.borderTopColor).toBe('rgb(216, 210, 202)');
    expect(computed.padding).toBe('12px');
    expect(getComputedStyle(project.querySelector('span.flex')).flexWrap).toBe('wrap');
    expect(requestBff).toHaveBeenCalledTimes(1);
  });

  it('applies the reference inset and opaque main surface to the page actually mounted in the shell', async () => {
    const heading = await openDashboard();
    const main = heading.closest('main');
    expect(main).not.toBeNull();
    const computed = getComputedStyle(main);
    expect(computed.paddingBlock).toBe('1.5rem');
    expect(computed.backgroundColor).toBe('rgb(245, 243, 240)');
  });

  it('applies reference position, shadow and row rhythm to the real six-entry sidebar', async () => {
    await openDashboard();
    const sidebar = screen.getByRole('complementary', { name: 'Navigation principale' });
    const computed = getComputedStyle(sidebar);
    expect(computed.position).toBe('relative');
    expect(computed.zIndex).toBe('20');
    expect(shadow(computed.boxShadow)).toEqual([
      { lengths: [8, 0, 24, 0], color: 'rgba(12, 28, 48, 0.28)' },
    ]);
    const buttons = within(sidebar).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(defaultSidebarItems
      .filter(({ label }) => label !== 'Administration').map(({ label }) => label));
    for (const button of buttons) {
      expect(getComputedStyle(button).minHeight).toBe('44px');
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
