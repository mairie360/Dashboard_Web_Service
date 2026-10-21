import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { CalendarDays } from 'lucide-react';

import { ProjectRow, TaskRow, EventRow, EventDateBadge, QuickActionButton, PerformanceMetric, clampProgress, projectStatusBadge, eventDateParts, byStart, metricTrend } from '@/components/dashboard';
import { defaultDashboardProjects, defaultDashboardTasks, defaultDashboardEvents, defaultDashboardQuickActions, defaultDashboardPerformance } from '../dashboard-fixtures';

describe('ProjectRow (MAIR-608)', () => {
  it('shows the name, the shared status pill, the deadline and a clamped progress meter, and delegates selection', async () => {
    const user = userEvent.setup(); const onSelect = vi.fn();
    const { container, rerender } = render(<ProjectRow project={{ ...defaultDashboardProjects[0], progress: 140 }} onSelect={onSelect} />);
    const row = screen.getByRole('button', { name: /Rénovation bibliothèque/ });
    expect(row).toHaveAttribute('data-project-status', 'in-progress');
    expect(screen.getByText('En cours')).toHaveAttribute('data-status', 'inprogress');
    expect(screen.getByText('Échéance: 15 Nov 2024')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Progression' })).toHaveAttribute('aria-valuenow', '100');
    await user.click(row); expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'library' }));
    expect((await axe(container)).violations).toEqual([]);
    rerender(<ProjectRow project={defaultDashboardProjects[2]} />);
    expect(screen.getByRole('button')).toBeDisabled(); expect(screen.getByText('Terminé')).toHaveAttribute('data-status', 'done');
    expect(screen.getByRole('progressbar').parentElement).toHaveAttribute('data-tone', 'success');
  });
  it('maps every dashboard status to a shared status and clamps progress', () => {
    expect(projectStatusBadge).toEqual({ 'in-progress': 'inprogress', completed: 'done', paused: 'draft' });
    expect([clampProgress(-5), clampProgress(42.4), clampProgress(Number.NaN)]).toEqual([0, 42.4, 0]);
  });
});

describe('TaskRow', () => {
  it('shows the title, deadline and priority pill and delegates selection', async () => {
    const user = userEvent.setup(); const onSelect = vi.fn();
    render(<TaskRow task={defaultDashboardTasks[0]} onSelect={onSelect} />);
    const row = screen.getByRole('button', { name: /Validation budget formation/ });
    expect(row).toHaveAttribute('data-task-priority', 'high'); expect(screen.getByText('Haute')).toHaveAttribute('data-priority', 'high');
    expect(screen.getByText("Échéance: Aujourd'hui")).toBeInTheDocument();
    await user.click(row); expect(onSelect).toHaveBeenCalledWith(defaultDashboardTasks[0]);
  });
});

describe('EventRow and EventDateBadge', () => {
  it('formats the start as day, short month and 24 h time, with placeholders for an unreadable value', () => {
    expect(eventDateParts('2026-10-20T14:00:00')).toEqual({ day: '20', month: 'oct', time: '14:00' });
    expect(eventDateParts('not a date')).toEqual({ day: '--', month: '---', time: '--:--' });
    expect(byStart([{ startsAt: '2026-11-02T10:00:00' }, { startsAt: '2026-10-02T10:00:00' }]).map((event) => event.startsAt)).toEqual(['2026-10-02T10:00:00', '2026-11-02T10:00:00']);
    render(<EventDateBadge startsAt="2026-10-20T14:00:00" />);
    expect(screen.getByText('20 oct')).toBeInTheDocument(); expect(screen.getByText('14:00')).toBeInTheDocument();
  });
  it('renders the title and location and delegates selection', async () => {
    const user = userEvent.setup(); const onSelect = vi.fn();
    render(<EventRow event={defaultDashboardEvents[0]} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /Conseil Municipal/ }));
    expect(onSelect).toHaveBeenCalledWith(defaultDashboardEvents[0]); expect(screen.getByText('Salle du conseil')).toBeInTheDocument();
  });
});

describe('QuickActionButton and PerformanceMetric', () => {
  it('dispatches its action id and stays disabled without a handler or when disabled', async () => {
    const user = userEvent.setup(); const onAction = vi.fn();
    const { rerender } = render(<QuickActionButton action={defaultDashboardQuickActions[0]} onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Nouveau document' })); expect(onAction).toHaveBeenCalledWith('new-document');
    rerender(<QuickActionButton action={{ ...defaultDashboardQuickActions[0], disabled: true }} onAction={onAction} />);
    expect(screen.getByRole('button')).toBeDisabled();
    rerender(<QuickActionButton action={{ id: 'view-reports', label: 'Voir rapports', icon: CalendarDays }} />);
    expect(screen.getByRole('button', { name: 'Voir rapports' })).toBeDisabled();
  });
  it('renders a performance indicator with its tone', () => {
    render(<PerformanceMetric metric={defaultDashboardPerformance[2]} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Alertes actives' })).toBeInTheDocument();
    expect(screen.getByText('3')).toHaveAttribute('data-tone', 'warning'); expect(screen.getByText('Nécessitent attention')).toBeInTheDocument();
  });
  it('derives the metric trend from the trend tone', () => {
    const base = { id: 'x', label: 'x', value: 1, tone: 'blue' as const, icon: CalendarDays };
    expect(metricTrend(base)).toBe('none');
    expect(metricTrend({ ...base, trend: '+1', trendTone: 'positive' })).toBe('up');
    expect(metricTrend({ ...base, trend: '-1', trendTone: 'negative' })).toBe('down');
    expect(metricTrend({ ...base, trend: '=', trendTone: 'neutral' })).toBe('none');
  });
});
