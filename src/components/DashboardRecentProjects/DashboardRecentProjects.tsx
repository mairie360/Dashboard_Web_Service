"use client";
import React from "react";
import { Panel } from "@mairie360/lib-components/primitives";

import type { DashboardProject } from '../dashboard-types';
import { DashboardRowSkeletons } from '../DashboardRowSkeleton';
import { PanelViewAll } from '../PanelViewAll';
import { ProjectRow } from './components/ProjectRow';

export interface DashboardRecentProjectsProps extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  projects?: DashboardProject[];
  onSelect?: (project: DashboardProject) => void;
  onViewAll?: () => void;
  /** Rows only, for a host that already provides the panel frame (DashboardPanel). */
  bare?: boolean;
  /** Three skeleton rows in place of the data (MAIR-899). */
  loading?: boolean;
}

/** The recent projects list; each row delegates its selection. */
export const DashboardRecentProjects = ({ projects = [], onSelect, onViewAll, bare = false, loading = false, className = "", ...props }: DashboardRecentProjectsProps) => {
  const rows = <div className="dashboard-rows" aria-busy={loading || undefined}>{loading ? <DashboardRowSkeletons kind="project" /> : projects.map((project) => <ProjectRow key={project.id} project={project} onSelect={onSelect} />)}</div>;
  if (bare) return <div {...props} className={`dashboard-recent-projects ${className}`.trim()}>{rows}</div>;
  return (
    <Panel {...props} title="Projets récents" action={onViewAll ? <PanelViewAll onClick={onViewAll} /> : undefined} state={!loading && projects.length === 0 ? "empty" : "default"} stateProps={{ title: "Aucun projet récent.", description: null }} className={`dashboard-recent-projects ${className}`.trim()}>
      {rows}
    </Panel>
  );
};
