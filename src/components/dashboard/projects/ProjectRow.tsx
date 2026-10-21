"use client";
import { BodySmall, ProgressMeter, StatusBadge, Text } from "@mairie360/lib-components/primitives";

import type { DashboardProject } from "../types";
import { clampProgress, projectStatusBadge, projectStatusLabels } from "./project-status";

export interface ProjectRowProps {
  project: DashboardProject;
  onSelect?: (project: DashboardProject) => void;
}

/** One recent project: name, status pill, deadline and progress meter (Figma DashboardRecentProjects row). */
export const ProjectRow = ({ project, onSelect }: ProjectRowProps) => {
  const progress = clampProgress(project.progress);
  return (
    <button type="button" disabled={!onSelect} data-project-status={project.status} className="dashboard-project-row block w-full rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mairie-accent)] disabled:cursor-default" onClick={() => onSelect?.(project)}>
      <span className="flex items-center justify-between gap-4">
        <Text weight="semibold" truncate>{project.name}</Text>
        <StatusBadge status={projectStatusBadge[project.status]} label={projectStatusLabels[project.status]} size="s" />
      </span>
      <BodySmall as="span" tone="muted" className="mt-1 block">Échéance: {project.dueDate}</BodySmall>
      <ProgressMeter label="Progression" value={progress} size="s" tone={progress >= 100 ? "success" : "primary"} className="mt-2" />
    </button>
  );
};
