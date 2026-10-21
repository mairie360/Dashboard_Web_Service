import React from 'react';

import { clampDashboardProgress, dashboardCardActionClasses, joinDashboardClasses } from './styles';
import type { DashboardProject, DashboardProjectStatus } from './types';

export interface DashboardRecentProjectsProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
  projects?: DashboardProject[];
  onSelect?: (project: DashboardProject) => void;
  onViewAll?: () => void;
}

const statusLabels: Record<DashboardProjectStatus, string> = {
  'in-progress': 'En cours',
  completed: 'Terminé',
  paused: 'En pause',
};

const statusStyles: Record<DashboardProjectStatus, string> = {
  'in-progress': 'bg-[var(--mairie-action-background)] text-[var(--mairie-on-action)]',
  completed: 'bg-[var(--mairie-success-action-background)] text-[var(--mairie-on-action)]',
  paused: 'bg-[var(--mairie-warning-surface)] text-[var(--mairie-warning-text)]',
};

export const DashboardRecentProjects = ({
  projects = [],
  onSelect,
  onViewAll,
  className = '',
  ...props
}: DashboardRecentProjectsProps) => (
  <section className={joinDashboardClasses('rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-6', className)} {...props}>
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-base font-semibold text-[var(--mairie-text)]">Projets récents</h2>
      {onViewAll && <button type="button" className={dashboardCardActionClasses} onClick={onViewAll}>Voir tout</button>}
    </div>
    <div className="mt-6 space-y-4">
      {projects.map((project) => {
        const progress = clampDashboardProgress(project.progress);
        return (
          <button key={project.id} type="button" disabled={!onSelect} className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mairie-accent)]/30 disabled:cursor-default" onClick={() => onSelect?.(project)}>
            <span className="flex items-center justify-between gap-4">
              <span className="font-semibold text-[var(--mairie-text)]">{project.name}</span>
              <span className={joinDashboardClasses('rounded-md px-2.5 py-1 text-xs font-semibold', statusStyles[project.status])}>{statusLabels[project.status]}</span>
            </span>
            <span className="mt-2 flex items-center justify-between gap-4 text-sm text-[var(--mairie-muted)]">
              <span>Progression: {progress}%</span>
              <span>Échéance: {project.dueDate}</span>
            </span>
            <span className="mt-2 block h-2 overflow-hidden rounded-full bg-[var(--mairie-surface-raised)]" aria-label={`Progression ${progress}%`} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <span className="block h-full rounded-full bg-[var(--mairie-action-background)]" style={{ width: `${progress}%` }} />
            </span>
          </button>
        );
      })}
      {projects.length === 0 && <p className="py-8 text-center text-sm text-[var(--mairie-muted)]">Aucun projet récent.</p>}
    </div>
  </section>
);
