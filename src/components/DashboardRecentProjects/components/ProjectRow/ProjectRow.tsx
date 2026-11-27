"use client";
import { CalendarClock } from "lucide-react";
import { BodySmall, Icon, ProgressMeter, StatusBadge, Text } from "@mairie360/lib-components/primitives";

import type { DashboardProject } from '@/components/dashboard-types';
import { clampProgress, projectStatusBadge, projectStatusLabels } from './project-status';

export interface ProjectRowProps {
  project: DashboardProject;
  onSelect?: (project: DashboardProject) => void;
}

/**
 * One recent project as a compact row (Figma Dashboard/ProjectRow): name and status pill, then the
 * deadline (« 15 déc. 2026 » after a calendar icon), the progress track over the rest of the line and its
 * percentage on the right.
 */
export const ProjectRow = ({ project, onSelect }: ProjectRowProps) => {
  const progress = clampProgress(project.progress);
  return (
    <button type="button" disabled={!onSelect} data-project-status={project.status} className="dashboard-row dashboard-project-row" onClick={() => onSelect?.(project)}>
      <span className="dashboard-row-line">
        <Text weight="semibold" truncate>{project.name}</Text>
        <StatusBadge status={projectStatusBadge[project.status]} label={projectStatusLabels[project.status]} size="s" />
      </span>
      <span className="dashboard-row-line dashboard-row-progress-line">
        <BodySmall as="span" tone="muted" className="dashboard-row-meta"><Icon icon={CalendarClock} size="xs" /><span className="sr-only">Échéance : </span>{project.dueDate}</BodySmall>
        <ProgressMeter label="Progression" value={progress} size="s" tone={progress >= 100 ? "success" : "primary"} className="dashboard-row-progress" />
      </span>
    </button>
  );
};
