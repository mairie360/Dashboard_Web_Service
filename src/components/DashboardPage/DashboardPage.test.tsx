import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';

import DashboardPage, { dashboardSidebarItems, dashboardUnreadCount, unreadBadge } from './DashboardPage';
import { pageStatus } from '../../../tests/component/page-roles';

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
