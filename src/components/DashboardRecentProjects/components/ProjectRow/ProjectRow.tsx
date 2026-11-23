"use client";
import { CalendarDays } from "lucide-react";
import { BodySmall, Icon, ProgressMeter, StatusBadge, Text } from "@mairie360/lib-components/primitives";

import type { DashboardProject } from '@/components/dashboard-types';
import { clampProgress, projectStatusBadge, projectStatusLabels } from './project-status';

export interface ProjectRowProps {
  project: DashboardProject;
  onSelect?: (project: DashboardProject) => void;
}

/**
 * One recent project as a compact row (Figma Dashboard/ProjectRow, MAIR-907): name and status pill,
 * then the deadline, the progress track and its percentage on the same line.
 */
export const ProjectRow = ({ project, onSelect }: ProjectRowProps) => {
  const progress = clampProgress(project.progress);
  return (
    <button type="button" disabled={!onSelect} data-project-status={project.status} className="dashboard-row dashboard-project-row" onClick={() => onSelect?.(project)}>
      <span className="dashboard-row-line">
        <Text weight="semibold" truncate>{project.name}</Text>
        <StatusBadge status={projectStatusBadge[project.status]} label={projectStatusLabels[project.status]} size="s" />
      </span>
      <span className="dashboard-row-line">
        <BodySmall as="span" tone="muted" className="dashboard-row-meta"><Icon icon={CalendarDays} size="xs" />Échéance : {project.dueDate}</BodySmall>
        <ProgressMeter label="Progression" value={progress} size="s" tone={progress >= 100 ? "success" : "primary"} className="dashboard-row-progress" />
      </span>
    </button>
  );
};
