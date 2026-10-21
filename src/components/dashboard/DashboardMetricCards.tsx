import React from 'react';

import { joinDashboardClasses } from './styles';
import type { DashboardMetric, DashboardTone } from './types';

export interface DashboardMetricCardsProps extends React.HTMLAttributes<HTMLDivElement> {
  metrics?: DashboardMetric[];
}

const toneStyles: Record<DashboardTone, string> = {
  blue: 'text-[var(--mairie-accent)] bg-[var(--mairie-accent-surface)]',
  green: 'text-[var(--mairie-success-text)] bg-[var(--mairie-success-surface)]',
  purple: 'text-[var(--mairie-purple-text)] bg-[var(--mairie-purple-surface)]',
  orange: 'text-[var(--mairie-warning-text)] bg-[var(--mairie-warning-surface)]',
  red: 'text-[var(--mairie-error-text)] bg-[var(--mairie-error-surface)]',
};

export const DashboardMetricCards = ({
  metrics = [],
  className = '',
  ...props
}: DashboardMetricCardsProps) => (
  <div className={joinDashboardClasses('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)} {...props}>
    {metrics.map((metric) => {
      const Icon = metric.icon;
      return (
        <article key={metric.id} className="rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <dl>
              <dt className="text-sm text-[var(--mairie-muted)]">{metric.label}</dt>
              <dd className="mt-1 text-2xl font-bold text-[var(--mairie-text)]">{metric.value}</dd>
              {metric.trend && (
                <dd className={joinDashboardClasses(
                  'mt-1 text-xs font-medium',
                  metric.trendTone === 'negative' ? 'text-[var(--mairie-error-text)]' : metric.trendTone === 'neutral' ? 'text-[var(--mairie-muted)]' : 'text-[var(--mairie-success-text)]'
                )}>{metric.trend}</dd>
              )}
            </dl>
            <div className={joinDashboardClasses('flex size-10 items-center justify-center rounded-md', toneStyles[metric.tone])}>
              <Icon className="size-7" strokeWidth={2} aria-hidden="true" />
            </div>
          </div>
        </article>
      );
    })}
  </div>
);
