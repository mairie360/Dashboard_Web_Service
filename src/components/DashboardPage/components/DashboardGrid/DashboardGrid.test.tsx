import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DashboardGrid } from './DashboardGrid';

vi.mock('@/lib/front-urls', () => ({ frontUrl: vi.fn((key: string) => key === 'PROJECT_FRONT_URL' ? 'https://project.example/' : undefined) }));

describe('DashboardGrid', () => {
  const data = {
    userFirstName: 'Alice',
    projects: [{ id: 'p1', title: 'Projet', progress: 10, status: 'review', dueDate: '2026-09-20' }],
    tasks: [{ id: 't1', title: 'Tâche', dueDate: '2026-09-21', priority: 'high', completed: false, projectId: 'p1' }],
    events: [{ id: 1, title: 'Événement', date: '2026-09-22', startTime: '10:00', location: 'Salle' }],
    metrics: { totalProjects: 1 }, sources: { projects: 'available', tasks: 'available', calendar: 'unavailable' },
  } as never;
  it('wires the three panels to the configured fronts and falls back to disabled actions', async () => {
    const user = userEvent.setup(); const { toDashboardModuleData } = await import('@/lib/dashboard-view');
    const hrefs: string[] = []; Object.defineProperty(window, 'location', { value: { set href(value: string) { hrefs.push(value); } }, writable: true });
    render(<DashboardGrid data={data} view={toDashboardModuleData(data)} />);
    expect(screen.getByRole('link', { name: 'Voir les projets' })).toHaveAttribute('href', 'https://project.example/');
    expect(screen.getByRole('button', { name: 'Ouvrir le calendrier' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Tâche/ })); expect(hrefs).toEqual(['https://project.example/?project=p1&task=t1']);
    await user.click(screen.getByRole('button', { name: /^Projet/ })); expect(hrefs[1]).toBe('https://project.example/?project=p1');
    expect(screen.getByRole('status')).toHaveTextContent('Les événements sont temporairement indisponibles.');
  });
});
