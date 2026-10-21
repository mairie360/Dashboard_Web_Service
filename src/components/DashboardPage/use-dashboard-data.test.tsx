import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';

import { useDashboardData } from './use-dashboard-data';
import { calendarEventHref, projectHref, dashboardUrls } from './components/DashboardGrid/dashboard-links';

const getDashboardBootstrap = vi.hoisted(() => vi.fn());
vi.mock('@/lib/bff-client', () => ({ bffDashboard: { getDashboardBootstrap: async (options: unknown) => ({ data: await getDashboardBootstrap(options) }) } }));
vi.mock('@/lib/front-urls', () => ({ frontUrl: vi.fn((key: string) => key === 'CALENDAR_FRONT_URL' ? 'https://calendar.example/' : undefined) }));

const bootstrap = (overrides = {}) => ({ userFirstName: 'Alice', projects: [], tasks: [], events: [], metrics: { totalProjects: 0 }, sources: { projects: 'available', tasks: 'available', calendar: 'available' }, ...overrides });

function Probe({ initial }: { initial?: ReturnType<typeof bootstrap> | null }) {
  const { data, view, error, loading, reload } = useDashboardData(initial as never);
  return <><p data-testid="state">{loading ? 'loading' : 'idle'}|{error}|{data?.userFirstName ?? ''}|{view ? view.projects.length : -1}</p><button onClick={reload}>reload</button></>;
}

beforeEach(() => { getDashboardBootstrap.mockReset(); });

describe('useDashboardData (MAIR-608)', () => {
  it('loads once, exposes the derived view and keeps the last confirmed data through a failed reload', async () => {
    getDashboardBootstrap.mockResolvedValueOnce(bootstrap({ projects: [{ id: 'p', title: 'P', progress: 1, status: 'todo', dueDate: '2026-01-01' }] }));
    render(<Probe />);
    expect(screen.getByTestId('state')).toHaveTextContent('loading|||-1');
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('idle||Alice|1'));
    getDashboardBootstrap.mockRejectedValueOnce(new Error('BFF injoignable'));
    await act(async () => { screen.getByRole('button', { name: 'reload' }).click(); });
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('idle|BFF injoignable|Alice|1'));
    expect(getDashboardBootstrap).toHaveBeenCalledTimes(2);
  });
  it('skips the initial read when a usable server bootstrap is given and rejects an unusable payload', async () => {
    render(<Probe initial={bootstrap({ userFirstName: 'Serveur' })} />);
    expect(screen.getByTestId('state')).toHaveTextContent('idle||Serveur|0'); expect(getDashboardBootstrap).not.toHaveBeenCalled();
    getDashboardBootstrap.mockResolvedValueOnce({ nope: true });
    await act(async () => { screen.getByRole('button', { name: 'reload' }).click(); });
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('incohérentes'));
  });
  it('builds the module destinations only from configured front URLs', () => {
    expect(dashboardUrls.project).toBeUndefined(); expect(projectHref('p1', 't1')).toBeUndefined();
    expect(calendarEventHref({ id: 'e1', startsAt: '2026-10-21T09:00:00' })).toBe('https://calendar.example/?date=2026-10-21&event=e1');
  });
});
