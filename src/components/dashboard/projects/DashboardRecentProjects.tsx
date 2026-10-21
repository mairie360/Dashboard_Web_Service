"use client";
import React from "react";
import { Panel } from "@mairie360/lib-components/primitives";

import type { DashboardProject } from "../types";
import { PanelViewAll } from "../panels/PanelViewAll";
import { ProjectRow } from "./ProjectRow";

export interface DashboardRecentProjectsProps extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  projects?: DashboardProject[];
  onSelect?: (project: DashboardProject) => void;
  onViewAll?: () => void;
  /** Rows only, for a host that already provides the panel frame (DashboardPanel). */
  bare?: boolean;
}

/** The recent projects list; each row delegates its selection. */
export const DashboardRecentProjects = ({ projects = [], onSelect, onViewAll, bare = false, className = "", ...props }: DashboardRecentProjectsProps) => {
  const rows = <div className="dashboard-rows space-y-4">{projects.map((project) => <ProjectRow key={project.id} project={project} onSelect={onSelect} />)}</div>;
  if (bare) return <div {...props} className={`dashboard-recent-projects ${className}`.trim()}>{rows}</div>;
  return (
    <Panel {...props} title="Projets récents" action={onViewAll ? <PanelViewAll onClick={onViewAll} /> : undefined} state={projects.length === 0 ? "empty" : "default"} stateProps={{ title: "Aucun projet récent.", description: null }} className={`dashboard-recent-projects ${className}`.trim()}>
      {rows}
    </Panel>
  );
};
