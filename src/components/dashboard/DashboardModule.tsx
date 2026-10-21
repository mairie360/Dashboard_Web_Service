import React from 'react';

import { DashboardMetricCards } from './DashboardMetricCards';
import { DashboardPendingTasks } from './DashboardPendingTasks';
import { DashboardPerformancePanel } from './DashboardPerformancePanel';
import { DashboardQuickActions } from './DashboardQuickActions';
import { DashboardRecentProjects } from './DashboardRecentProjects';
import { DashboardUpcomingEvents } from './DashboardUpcomingEvents';
import { joinDashboardClasses } from './styles';
import type {
  DashboardEvent,
  DashboardMetric,
  DashboardPerformanceMetric,
  DashboardProject,
  DashboardQuickAction,
  DashboardQuickActionId,
  DashboardTask,
} from './types';

export interface DashboardModuleProps extends React.HTMLAttributes<HTMLElement> {
  userFirstName?: string;
  metrics?: DashboardMetric[];
  projects?: DashboardProject[];
  tasks?: DashboardTask[];
  quickActions?: DashboardQuickAction[];
  events?: DashboardEvent[];
  performance?: DashboardPerformanceMetric[];
  showPerformance?: boolean;
  onProjectSelect?: (project: DashboardProject) => void;
  onViewAllProjects?: () => void;
  onTaskSelect?: (task: DashboardTask) => void;
  onViewAllTasks?: () => void;
  onQuickAction?: (action: DashboardQuickActionId) => void;
  onEventSelect?: (event: DashboardEvent) => void;
  onOpenCalendar?: () => void;
}

export const DashboardModule = ({
  userFirstName,
  metrics = [],
  projects = [],
  tasks = [],
  quickActions = [],
  events = [],
  performance = [],
  showPerformance = true,
  onProjectSelect,
  onViewAllProjects,
  onTaskSelect,
  onViewAllTasks,
  onQuickAction,
  onEventSelect,
  onOpenCalendar,
  className = '',
  ...props
}: DashboardModuleProps) => (
  <section className={joinDashboardClasses('space-y-6 bg-[var(--mairie-background)] text-[var(--mairie-text)]', className)} {...props}>
    <header>
      <h1 className="text-[28px] font-bold leading-tight text-[var(--mairie-text)]">Tableau de Bord</h1>
      <p className="mt-1 text-base text-[var(--mairie-muted)]">
        {userFirstName ? `Bienvenue ${userFirstName}, voici un aperçu de vos activités` : 'Voici un aperçu de vos activités'}
      </p>
    </header>
    {metrics.length > 0 && <DashboardMetricCards metrics={metrics} />}
    <div className="grid gap-6 xl:grid-cols-2">
      <DashboardRecentProjects projects={projects} onSelect={onProjectSelect} onViewAll={onViewAllProjects} />
      <DashboardPendingTasks tasks={tasks} onSelect={onTaskSelect} onViewAll={onViewAllTasks} />
      {quickActions.length > 0 && <DashboardQuickActions actions={quickActions} onAction={onQuickAction} />}
      <DashboardUpcomingEvents events={events} onSelect={onEventSelect} onOpenCalendar={onOpenCalendar} />
    </div>
    {showPerformance && performance.length > 0 && <DashboardPerformancePanel metrics={performance} />}
  </section>
);
