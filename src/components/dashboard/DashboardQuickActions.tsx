import React from 'react';

import { joinDashboardClasses } from './styles';
import type { DashboardQuickAction, DashboardQuickActionId } from './types';

export interface DashboardQuickActionsProps extends React.HTMLAttributes<HTMLElement> {
  actions?: DashboardQuickAction[];
  onAction?: (action: DashboardQuickActionId) => void;
}

export const DashboardQuickActions = ({
  actions = [],
  onAction,
  className = '',
  ...props
}: DashboardQuickActionsProps) => (
  <section className={joinDashboardClasses('rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-6', className)} {...props}>
    <h2 className="text-base font-semibold text-[var(--mairie-text)]">Actions rapides</h2>
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button key={action.id} type="button" disabled={action.disabled || !onAction} className="flex min-h-20 flex-col items-center justify-center gap-3 rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface-raised)] px-4 py-3 font-medium text-[var(--mairie-text)] transition hover:bg-[var(--mairie-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mairie-accent)]/30 disabled:cursor-not-allowed disabled:opacity-45" onClick={() => onAction?.(action.id)}>
            <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  </section>
);
