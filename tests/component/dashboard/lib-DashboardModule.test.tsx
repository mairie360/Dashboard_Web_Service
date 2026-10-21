import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { DashboardModule } from '@/components/dashboard';
import { DashboardMetricCards } from '@/components/dashboard';
import { DashboardPendingTasks } from '@/components/dashboard';
import { DashboardPerformancePanel } from '@/components/dashboard';
import { DashboardQuickActions } from '@/components/dashboard';
import { DashboardRecentProjects } from '@/components/dashboard';
import { DashboardUpcomingEvents } from '@/components/dashboard';
import {
  defaultDashboardEvents,
  defaultDashboardMetrics,
  defaultDashboardPerformance,
  defaultDashboardProjects,
  defaultDashboardQuickActions,
  defaultDashboardTasks,
} from './dashboard-fixtures';

const fixtureProps = {
  metrics: defaultDashboardMetrics,
  projects: defaultDashboardProjects,
  tasks: defaultDashboardTasks,
  quickActions: defaultDashboardQuickActions,
  events: defaultDashboardEvents,
  performance: defaultDashboardPerformance,
};

describe('DashboardModule', () => {
  it('renders the personalized overview and ATP sections', () => {
    render(<DashboardModule {...fixtureProps} userFirstName="Alice" />);

    expect(screen.getByRole('heading', { name: 'Tableau de Bord' })).toBeInTheDocument();
    expect(screen.getByText('Bienvenue Alice, voici un aperçu de vos activités')).toBeInTheDocument();
    expect(screen.getByText('Projets actifs')).toBeInTheDocument();
    expect(screen.getByText('Citoyens servis')).toBeInTheDocument();
    expect(screen.getByText('Documents traités')).toBeInTheDocument();
    expect(screen.getByText('Événements ce mois')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Projets récents' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tâches en attente' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Actions rapides' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Événements à venir' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aperçu des performances' })).toBeInTheDocument();
  });

  it('opens projects and tasks from their summaries', () => {
    const onProjectSelect = vi.fn();
    const onViewAllProjects = vi.fn();
    const onTaskSelect = vi.fn();
    const onViewAllTasks = vi.fn();
    render(<DashboardModule {...fixtureProps} {...{ onProjectSelect, onViewAllProjects, onTaskSelect, onViewAllTasks }} />);

    fireEvent.click(screen.getByRole('button', { name: /Rénovation bibliothèque/ }));
    fireEvent.click(within(screen.getByRole('heading', { name: 'Projets récents' }).closest('section')!).getByRole('button', { name: 'Voir tout' }));
    fireEvent.click(screen.getByRole('button', { name: /Validation budget formation/ }));
    fireEvent.click(within(screen.getByRole('heading', { name: 'Tâches en attente' }).closest('section')!).getByRole('button', { name: 'Voir tout' }));

    expect(onProjectSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'library' }));
    expect(onViewAllProjects).toHaveBeenCalledTimes(1);
    expect(onTaskSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'training-budget' }));
    expect(onViewAllTasks).toHaveBeenCalledTimes(1);
  });

  it('dispatches all authorized quick actions', () => {
    const onQuickAction = vi.fn();
    render(<DashboardModule {...fixtureProps} onQuickAction={onQuickAction} />);

    fireEvent.click(screen.getByRole('button', { name: 'Nouveau document' }));
    fireEvent.click(screen.getByRole('button', { name: 'Planifier événement' }));
    fireEvent.click(screen.getByRole('button', { name: 'Contacter équipe' }));
    fireEvent.click(screen.getByRole('button', { name: 'Voir rapports' }));

    expect(onQuickAction.mock.calls.map(([action]) => action)).toEqual([
      'new-document',
      'schedule-event',
      'contact-team',
      'view-reports',
    ]);
  });

  it('orders upcoming events and opens the calendar', () => {
    const onEventSelect = vi.fn();
    const onOpenCalendar = vi.fn();
    render(
      <DashboardModule
        events={[
          { id: 'later', title: 'Plus tard', location: 'B', startsAt: '2026-11-02T10:00:00' },
          { id: 'first', title: 'En premier', location: 'A', startsAt: '2026-10-02T10:00:00' },
        ]}
        onEventSelect={onEventSelect}
        onOpenCalendar={onOpenCalendar}
      />
    );

    const eventButtons = screen.getAllByRole('button').filter((button) => /En premier|Plus tard/.test(button.textContent ?? ''));
    expect(eventButtons[0]).toHaveTextContent('En premier');
    fireEvent.click(screen.getByRole('button', { name: /En premier/ }));
    fireEvent.click(within(screen.getByRole('heading', { name: 'Événements à venir' }).closest('section')!).getByRole('button', { name: 'Voir tout' }));
    expect(onEventSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'first' }));
    expect(onOpenCalendar).toHaveBeenCalledTimes(1);
  });

  it('supports hiding privileged performance data', () => {
    render(<DashboardModule {...fixtureProps} showPerformance={false} quickActions={[]} />);
    expect(screen.queryByRole('heading', { name: 'Aperçu des performances' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Voir rapports' })).not.toBeInTheDocument();
  });

  it('does not invent business data when props are omitted', () => {
    render(<DashboardModule />);

    expect(screen.getByText('Voici un aperçu de vos activités')).toBeInTheDocument();
    expect(screen.getByText('Aucun projet récent.')).toBeInTheDocument();
    expect(screen.getByText('Aucune tâche en attente.')).toBeInTheDocument();
    expect(screen.getByText('Aucun événement à venir.')).toBeInTheDocument();
    expect(screen.queryByText('Rénovation bibliothèque')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Actions rapides' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Aperçu des performances' })).not.toBeInTheDocument();
  });

  it('keeps standalone panels free of implicit demo records and actions', () => {
    render(<>
      <DashboardMetricCards />
      <DashboardRecentProjects />
      <DashboardPendingTasks />
      <DashboardQuickActions />
      <DashboardUpcomingEvents />
      <DashboardPerformancePanel />
    </>);

    expect(screen.queryByText('Rénovation bibliothèque')).not.toBeInTheDocument();
    expect(screen.queryByText('Validation budget formation')).not.toBeInTheDocument();
    expect(screen.queryByText('Conseil Municipal')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Voir rapports' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Voir tout' })).not.toBeInTheDocument();
  });

  it('uses one neutral card action treatment without changing navigation callbacks', () => {
    const onViewAllProjects = vi.fn();
    const onViewAllTasks = vi.fn();
    const onOpenCalendar = vi.fn();
    render(<DashboardModule onViewAllProjects={onViewAllProjects} onViewAllTasks={onViewAllTasks} onOpenCalendar={onOpenCalendar} />);

    const cardTitles = ['Projets récents', 'Tâches en attente', 'Événements à venir'];
    const actions = cardTitles.map((title) =>
      within(screen.getByRole('heading', { name: title }).closest('section')!).getByRole('button', { name: 'Voir tout' })
    );
    expect(actions[0].className).toBe(actions[1].className);
    expect(actions[1].className).toBe(actions[2].className);
    // MAIR-608: the lib LinkButton (Figma Base/Button/Link, TextIcon) is the one action treatment of a panel.
    for (const action of actions) { expect(action.tagName).toBe('BUTTON'); expect(action.querySelector('svg')).not.toBeNull(); expect(action).toHaveClass('underline'); }

    actions.forEach((action) => fireEvent.click(action));
    expect(onViewAllProjects).toHaveBeenCalledTimes(1);
    expect(onViewAllTasks).toHaveBeenCalledTimes(1);
    expect(onOpenCalendar).toHaveBeenCalledTimes(1);
  });
});
