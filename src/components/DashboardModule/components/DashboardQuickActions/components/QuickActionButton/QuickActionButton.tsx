"use client";
import { Icon, Text } from "@mairie360/lib-components/primitives";

import type { DashboardQuickAction, DashboardQuickActionId } from '@/components/dashboard-types';

export interface QuickActionButtonProps {
  action: DashboardQuickAction;
  onAction?: (action: DashboardQuickActionId) => void;
}

/** One quick action tile: icon above its label. */
export const QuickActionButton = ({ action, onAction }: QuickActionButtonProps) => (
  <button type="button" disabled={action.disabled || !onAction} data-action={action.id} className="flex min-h-20 flex-col items-center justify-center gap-3 rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface-raised)] px-4 py-3 text-[var(--mairie-text)] transition hover:bg-[var(--mairie-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mairie-accent)] disabled:cursor-not-allowed disabled:opacity-45" onClick={() => onAction?.(action.id)}>
    <Icon icon={action.icon} size="m" />
    <Text as="span" weight="medium">{action.label}</Text>
  </button>
);
