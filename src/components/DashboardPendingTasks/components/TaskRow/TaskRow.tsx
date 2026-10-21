"use client";
import { BodySmall, PriorityPill, Text } from "@mairie360/lib-components/primitives";

import type { DashboardTask } from '@/components/dashboard-types';

export interface TaskRowProps {
  task: DashboardTask;
  onSelect?: (task: DashboardTask) => void;
}

/** One pending task: title, deadline and priority pill (Figma DashboardPendingTasks row). */
export const TaskRow = ({ task, onSelect }: TaskRowProps) => (
  <button type="button" disabled={!onSelect} data-task-priority={task.priority} className="dashboard-task-row flex w-full items-center gap-3 rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface-raised)] px-3 py-3 text-left transition hover:bg-[var(--mairie-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mairie-accent)] disabled:cursor-default" onClick={() => onSelect?.(task)}>
    <span className="size-2 shrink-0 rounded-full bg-[var(--mairie-warning-text)]" aria-hidden="true" />
    <span className="min-w-0 flex-1">
      <Text weight="semibold" truncate>{task.title}</Text>
      <BodySmall as="span" tone="muted" className="block">Échéance: {task.dueLabel}</BodySmall>
    </span>
    <PriorityPill level={task.priority} size="s" />
  </button>
);
