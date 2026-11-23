"use client";
import React from "react";
import { Panel } from "@mairie360/lib-components/primitives";

import type { DashboardTask } from '../dashboard-types';
import { DashboardRowSkeletons } from '../DashboardRowSkeleton';
import { PanelViewAll } from '../PanelViewAll';
import { TaskRow } from './components/TaskRow';

export interface DashboardPendingTasksProps extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  tasks?: DashboardTask[];
  onSelect?: (task: DashboardTask) => void;
  onViewAll?: () => void;
  bare?: boolean;
  /** Three skeleton rows in place of the data (MAIR-899). */
  loading?: boolean;
}

/** The pending tasks list; each row delegates its selection. */
export const DashboardPendingTasks = ({ tasks = [], onSelect, onViewAll, bare = false, loading = false, className = "", ...props }: DashboardPendingTasksProps) => {
  const rows = <div className="dashboard-rows" aria-busy={loading || undefined}>{loading ? <DashboardRowSkeletons kind="task" /> : tasks.map((task) => <TaskRow key={task.id} task={task} onSelect={onSelect} />)}</div>;
  if (bare) return <div {...props} className={`dashboard-pending-tasks ${className}`.trim()}>{rows}</div>;
  return (
    <Panel {...props} title="Tâches en attente" action={onViewAll ? <PanelViewAll onClick={onViewAll} /> : undefined} state={!loading && tasks.length === 0 ? "empty" : "default"} stateProps={{ title: "Aucune tâche en attente.", description: null }} className={`dashboard-pending-tasks ${className}`.trim()}>
      {rows}
    </Panel>
  );
};
