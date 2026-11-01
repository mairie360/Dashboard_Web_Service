"use client";
import React from "react";

import { DashboardHeader } from '../DashboardHeader';
import { DashboardMetricCards } from './components/DashboardMetricCards';
import { DashboardPendingTasks } from '../DashboardPendingTasks';
import { DashboardPerformancePanel } from './components/DashboardPerformancePanel';
import { DashboardQuickActions } from './components/DashboardQuickActions';
import { DashboardRecentProjects } from '../DashboardRecentProjects';
import { DashboardUpcomingEvents } from '../DashboardUpcomingEvents';
import type { DashboardEvent, DashboardMetric, DashboardPerformanceMetric, DashboardProject, DashboardQuickAction, DashboardQuickActionId, DashboardTask } from '../dashboard-types';

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

/** The whole dashboard from already prepared data (storybook-style composition of the panels). */
export const DashboardModule = ({ userFirstName, metrics = [], projects = [], tasks = [], quickActions = [], events = [], performance = [], showPerformance = true, onProjectSelect, onViewAllProjects, onTaskSelect, onViewAllTasks, onQuickAction, onEventSelect, onOpenCalendar, className = "", ...props }: DashboardModuleProps) => (
  <section className={`space-y-6 bg-[var(--mairie-background)] text-[var(--mairie-text)] ${className}`.trim()} {...props}>
    <DashboardHeader userFirstName={userFirstName} showDate={false} />
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
