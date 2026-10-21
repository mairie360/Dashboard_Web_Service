import React from 'react';

import { dashboardCardActionClasses, joinDashboardClasses } from './styles';
import type { DashboardTask, DashboardTaskPriority } from './types';

export interface DashboardPendingTasksProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
  tasks?: DashboardTask[];
  onSelect?: (task: DashboardTask) => void;
  onViewAll?: () => void;
}

const priorityLabels: Record<DashboardTaskPriority, string> = { high: 'Haute', medium: 'Moyenne', low: 'Basse' };
const priorityStyles: Record<DashboardTaskPriority, string> = {
  high: 'bg-[var(--mairie-error-surface)] text-[var(--mairie-error-text)]',
  medium: 'bg-[var(--mairie-warning-surface)] text-[var(--mairie-warning-text)]',
  low: 'bg-[var(--mairie-success-surface)] text-[var(--mairie-success-text)]',
};

export const DashboardPendingTasks = ({
  tasks = [],
  onSelect,
  onViewAll,
  className = '',
  ...props
}: DashboardPendingTasksProps) => (
  <section className={joinDashboardClasses('rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-6', className)} {...props}>
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-base font-semibold text-[var(--mairie-text)]">Tâches en attente</h2>
      {onViewAll && <button type="button" className={dashboardCardActionClasses} onClick={onViewAll}>Voir tout</button>}
    </div>
    <div className="mt-6 space-y-3">
      {tasks.map((task) => (
        <button key={task.id} type="button" disabled={!onSelect} className="flex w-full items-center gap-3 rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface-raised)] px-3 py-3 text-left transition hover:bg-[var(--mairie-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mairie-accent)]/30 disabled:cursor-default" onClick={() => onSelect?.(task)}>
          <span className="size-2 shrink-0 rounded-full bg-[var(--mairie-warning-text)]" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-[var(--mairie-text)]">{task.title}</span>
            <span className="block text-sm text-[var(--mairie-muted)]">Échéance: {task.dueLabel}</span>
          </span>
          <span className={joinDashboardClasses('rounded-md px-2.5 py-1 text-xs font-medium', priorityStyles[task.priority])}>{priorityLabels[task.priority]}</span>
        </button>
      ))}
      {tasks.length === 0 && <p className="py-8 text-center text-sm text-[var(--mairie-muted)]">Aucune tâche en attente.</p>}
    </div>
  </section>
);
