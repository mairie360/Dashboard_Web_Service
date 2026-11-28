"use client";
import { Clock } from "lucide-react";
import { BodySmall, Icon, PriorityPill, Text } from "@mairie360/lib-components/primitives";

import type { DashboardTask } from '@/components/dashboard-types';

export interface TaskRowProps {
  task: DashboardTask;
  onSelect?: (task: DashboardTask) => void;
}

/** One pending task as a compact row (Figma Dashboard/TaskRow, MAIR-907): title, deadline and priority pill. */
export const TaskRow = ({ task, onSelect }: TaskRowProps) => (
  <button type="button" disabled={!onSelect} data-task-priority={task.priority} className="dashboard-row dashboard-task-row" onClick={() => onSelect?.(task)}>
    <span className="dashboard-row-line">
      <Text weight="semibold" truncate>{task.title}</Text>
      <PriorityPill level={task.priority} size="s" dot />
    </span>
    <BodySmall as="span" tone="muted" className="dashboard-row-meta"><Icon icon={Clock} size="xs" />Échéance : {task.dueLabel}</BodySmall>
  </button>
);
