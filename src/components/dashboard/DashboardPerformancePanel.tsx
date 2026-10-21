import React from 'react';

import { joinDashboardClasses } from './styles';
import type { DashboardPerformanceMetric } from './types';

export interface DashboardPerformancePanelProps extends React.HTMLAttributes<HTMLElement> {
  metrics?: DashboardPerformanceMetric[];
}

const toneStyles = {
  green: 'bg-[var(--mairie-success-surface)] text-[var(--mairie-success-text)]',
  blue: 'bg-[var(--mairie-accent-surface)] text-[var(--mairie-accent)]',
  orange: 'bg-[var(--mairie-warning-surface)] text-[var(--mairie-warning-text)]',
};

export const DashboardPerformancePanel = ({
  metrics = [],
  className = '',
  ...props
}: DashboardPerformancePanelProps) => (
  <section className={joinDashboardClasses('rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-6', className)} {...props}>
    <h2 className="text-base font-semibold text-[var(--mairie-text)]">Aperçu des performances</h2>
    <div className="mt-7 grid gap-7 sm:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <article key={metric.id} className="text-center">
            <div className={joinDashboardClasses('mx-auto flex size-16 items-center justify-center rounded-full', toneStyles[metric.tone])}>
              <Icon className="size-8" strokeWidth={2} aria-hidden="true" />
            </div>
            <h3 className="mt-3 font-semibold text-[var(--mairie-text)]">{metric.label}</h3>
            <div className={joinDashboardClasses('mt-1 text-xl font-bold', metric.tone === 'green' ? 'text-[var(--mairie-success-text)]' : metric.tone === 'blue' ? 'text-[var(--mairie-accent)]' : 'text-[var(--mairie-warning-text)]')}>{metric.value}</div>
            <p className="mt-1 text-sm text-[var(--mairie-muted)]">{metric.description}</p>
          </article>
        );
      })}
    </div>
  </section>
);
