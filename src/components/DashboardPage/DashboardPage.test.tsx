import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';

import DashboardPage, { dashboardSidebarItems, dashboardUnreadCount, unreadBadge } from './DashboardPage';
import { pageStatus } from '../../../tests/component/page-roles';
import { frontUrl } from '@/lib/front-urls';
import type { DashboardBootstrap } from '@/lib/dashboard-view';

vi.mock('@/lib/front-urls', () => ({ frontUrl: vi.fn(() => undefined) }));
vi.mock('@/lib/bff-client', () => ({ bffDashboard: { getDashboardBootstrap: vi.fn(() => new Promise(() => {})) } }));

describe('DashboardPage', () => {
  it('MAIR-924: the greeting follows the server render time, not the browser clock', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
      const { getByRole } = render(<DashboardPage renderedAt="2026-10-15T20:00:00Z" />);
      expect(getByRole('heading', { level: 1 })).toHaveTextContent('Bonsoir');
    } finally { vi.useRealTimers(); }
  });

  it('MAIR-924: a page rendered in the evening hydrates without a mismatch in a browser still at noon', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const recoverable = vi.fn();
    try {
      vi.setSystemTime(new Date('2026-10-15T20:00:00Z'));
      const renderedAt = new Date().toISOString();
      container.innerHTML = renderToString(<DashboardPage renderedAt={renderedAt} />);
      vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
      let root: ReturnType<typeof hydrateRoot> | undefined;
      await act(async () => { root = hydrateRoot(container, <DashboardPage renderedAt={renderedAt} />, { onRecoverableError: recoverable }); });
      expect(recoverable).not.toHaveBeenCalled();
      expect(container.querySelector('h1')).toHaveTextContent('Bonsoir');
      act(() => root?.unmount());
    } finally { vi.useRealTimers(); container.remove(); }
  });

  it('MAIR-1255: relative task deadlines do not break the hydration when the browser is on another day', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const recoverable = vi.fn();
    const initialData: DashboardBootstrap = { userFirstName: 'Alice', userLastName: 'Martin', userRole: null, communeName: null,
      projects: [], events: [], trainings: [], unreadMessages: null, onboardingCompleted: true,
      metrics: { totalProjects: 0, eventsThisMonth: 0, eventsPeriod: { from: '2026-11-01', to: '2026-11-30' } },
      tasks: [{ id: 't1', projectId: 'p', title: 'Valider le budget', dueDate: '2026-11-29', priority: 'high', completed: false }],
      sources: { projects: 'available', tasks: 'available', calendar: 'available', trainings: 'available', messages: 'available' } };
    try {
      // The server renders on the 28th (« Demain »), the browser still believes it is the 15th of October.
      vi.setSystemTime(new Date('2026-11-28T09:00:00Z'));
      const renderedAt = new Date().toISOString();
      container.innerHTML = renderToString(<DashboardPage initialData={initialData} renderedAt={renderedAt} />);
      expect(container.textContent).toContain('Échéance : 29 nov. 2026');
      vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
      let root: ReturnType<typeof hydrateRoot> | undefined;
      await act(async () => { root = hydrateRoot(container, <DashboardPage initialData={initialData} renderedAt={renderedAt} />, { onRecoverableError: recoverable }); });
      expect(recoverable).not.toHaveBeenCalled();
      // After mounting, the browser's own day gives the relative label (here more than six days ahead: the date).
      expect(container.textContent).toContain('Échéance : 29 nov. 2026');
      vi.setSystemTime(new Date('2026-11-28T09:00:00Z'));
      act(() => root?.unmount());
      const later = document.createElement('div');
      document.body.appendChild(later);
      later.innerHTML = renderToString(<DashboardPage initialData={initialData} renderedAt={renderedAt} />);
      await act(async () => { root = hydrateRoot(later, <DashboardPage initialData={initialData} renderedAt={renderedAt} />, { onRecoverableError: recoverable }); });
      expect(recoverable).not.toHaveBeenCalled();
      expect(later.textContent).toContain('Échéance : Demain');
      act(() => root?.unmount());
      later.remove();
    } finally { vi.useRealTimers(); container.remove(); }
  });

  it('renders the loading page while the bootstrap is pending', () => {
    render(<DashboardPage />);
    expect(pageStatus()).toHaveTextContent('Chargement du tableau de bord…');
  });

  it('MAIR-1106: shows the unread count on « Messagerie », « 99+ » beyond, nothing at 0 or without Message API', () => {
    expect([12, 0, null, undefined, 100, -1, 1.5].map(unreadBadge)).toEqual(['12', undefined, undefined, undefined, '99+', undefined, undefined]);
    const items = dashboardSidebarItems(5);
    expect(items.find((item) => item.id === 'messages')?.badge).toBe('5');
    expect(items.find((item) => item.id === 'training')?.label).toBe('E-learning');
    expect(dashboardSidebarItems(0).find((item) => item.id === 'messages')).not.toHaveProperty('badge');
  });

  it('MAIR-1106: shows the count only while Message API is available', () => {
    const sources = (messages: 'available' | 'unavailable') =>
      ({ projects: 'available', tasks: 'available', calendar: 'available', trainings: 'available', messages }) as const;
    const data = (unreadMessages: number | null, messages: 'available' | 'unavailable') =>
      ({ unreadMessages, sources: sources(messages) }) as unknown as Parameters<typeof dashboardUnreadCount>[0];
    expect(dashboardUnreadCount(data(7, 'available'))).toBe(7);
    expect(dashboardUnreadCount(data(7, 'unavailable'))).toBeNull();
    expect(dashboardUnreadCount(data(null, 'available'))).toBeNull();
    expect(dashboardUnreadCount(null)).toBeNull();
  });
});

describe('MAIR-1223 shared header', () => {
  const bootstrap = (communeName: string | null) => ({ userFirstName: 'Alice', userLastName: 'Martin', userRole: 'Agent', communeName, projects: [], tasks: [], events: [], trainings: [], metrics: { totalProjects: 0, eventsThisMonth: 0, eventsPeriod: { from: '2026-11-01', to: '2026-11-30' } }, sources: { projects: 'available', tasks: 'available', calendar: 'available', trainings: 'available', messages: 'available' }, unreadMessages: 0, onboardingCompleted: true });

  it('names the commune of the bootstrap in the header and the navigation, never the library sample', () => {
    const { container } = render(<DashboardPage initialData={bootstrap('Saint-Pierre') as never} />);
    expect(container.querySelector('header')?.textContent).toContain('Saint-Pierre');
    expect(container.querySelector('aside')?.textContent).toContain('Saint-Pierre');
    expect(container.textContent).not.toContain('Saint-André');
  });

  it('shows no commune at all when the instance names none', () => {
    const { container } = render(<DashboardPage initialData={bootstrap(null) as never} />);
    expect(container.querySelector('header')?.textContent).not.toMatch(/Mairie de|Saint-/);
    expect(container.querySelector('aside')?.textContent).not.toMatch(/Commune de|Saint-/);
  });
});

describe('MAIR-1230 global search in the shared header', () => {
  const bootstrap = { userFirstName: 'Alice', userLastName: 'Martin', userRole: 'Agent', communeName: 'Saint-Pierre', projects: [], tasks: [], events: [], trainings: [], metrics: { totalProjects: 0, eventsThisMonth: 0, eventsPeriod: { from: '2026-11-01', to: '2026-11-30' } }, sources: { projects: 'available', tasks: 'available', calendar: 'available', trainings: 'available', messages: 'available' }, unreadMessages: 0, onboardingCompleted: true };
  const fronts: Record<string, string> = { PROJECT_FRONT_URL: 'https://projects.test/', CALENDAR_FRONT_URL: 'https://calendar.test/', MESSAGE_FRONT_URL: 'https://messages.test/', ELEARNING_FRONT_URL: 'https://elearning.test/', ADMINISTRATION_FRONT_URL: 'https://admin.test/' };
  const answer = {
    groups: [
      { module: 'agents', items: [{ kind: 'agent', id: 3, title: 'Budget Bernard', excerpt: null, parent_id: null, updated_at: '2026-11-20T09:00:00Z' }] },
      { module: 'projects', items: [{ kind: 'task', id: 9, title: 'Voter le budget', excerpt: null, parent_id: 7, updated_at: '2026-11-20T09:00:00Z' }] },
      { module: 'messages', items: [{ kind: 'message', id: 12, title: 'Réunion budget', excerpt: 'Ordre du jour', parent_id: 4, updated_at: '2026-11-20T09:00:00Z' }] },
      { module: 'elearning', items: [{ kind: 'course', id: 5, title: 'Budget communal', excerpt: null, parent_id: null, updated_at: '2026-11-20T09:00:00Z' }] },
    ],
    unavailable: ['calendar'],
  };

  it('lists the results of the same-origin GET /search with links into their modules', async () => {
    vi.mocked(frontUrl).mockImplementation((key) => fronts[key]);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(answer), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      render(<DashboardPage initialData={bootstrap as never} />);
      fireEvent.change(screen.getByRole('combobox'), { target: { value: ' budget ' } });
      const option = await screen.findByRole('option', { name: /Voter le budget/ });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      expect(url).toBe('/search?q=budget');
      expect(init.credentials).toBe('same-origin');
      expect(option).toHaveAttribute('data-href', 'https://projects.test/?project=7&task=9');
      expect(screen.getByRole('option', { name: /Réunion budget/ })).toHaveAttribute('data-href', 'https://messages.test/?conversation=4&message=12');
      expect(screen.getByRole('option', { name: /Budget communal/ })).toHaveAttribute('data-href', 'https://elearning.test/?course=5');
      // An agent account gets no link into Administration, and the module that did not answer is named.
      expect(screen.getByRole('option', { name: /Budget Bernard/ })).not.toHaveAttribute('data-href');
      expect(screen.getByRole('note')).toHaveTextContent('Calendrier ne répond pas');
    } finally {
      vi.unstubAllGlobals();
      vi.mocked(frontUrl).mockImplementation(() => undefined);
    }
  });

  it('does not call the search below two characters and reports a failed search', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 502 }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      render(<DashboardPage initialData={bootstrap as never} />);
      const field = screen.getByRole('combobox');
      fireEvent.change(field, { target: { value: 'b' } });
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(fetchMock).not.toHaveBeenCalled();
      fireEvent.change(field, { target: { value: 'budget' } });
      await waitFor(() => expect(screen.getByRole('note')).toHaveTextContent('La recherche est indisponible'));
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
