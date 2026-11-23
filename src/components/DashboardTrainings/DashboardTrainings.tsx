"use client";
import React from "react";
import { Panel } from "@mairie360/lib-components/primitives";

import type { DashboardTraining } from '../dashboard-types';
import { DashboardRowSkeletons } from '../DashboardRowSkeleton';
import { PanelViewAll } from '../PanelViewAll';
import { TrainingRow } from './components/TrainingRow';

export interface DashboardTrainingsProps extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  trainings?: DashboardTraining[];
  onSelect?: (training: DashboardTraining) => void;
  onViewAll?: () => void;
  /** Rows only, for a host that already provides the panel frame (DashboardPanel). */
  bare?: boolean;
  /** Three skeleton rows in place of the data (MAIR-899). */
  loading?: boolean;
}

/** « Mes formations » (MAIR-1110): the trainings of the agent; each row delegates its selection. */
export const DashboardTrainings = ({ trainings = [], onSelect, onViewAll, bare = false, loading = false, className = "", ...props }: DashboardTrainingsProps) => {
  const rows = <div className="dashboard-rows" aria-busy={loading || undefined}>{loading ? <DashboardRowSkeletons kind="project" /> : trainings.map((training) => <TrainingRow key={training.id} training={training} onSelect={onSelect} />)}</div>;
  if (bare) return <div {...props} className={`dashboard-trainings ${className}`.trim()}>{rows}</div>;
  return (
    <Panel {...props} title="Mes formations" action={onViewAll ? <PanelViewAll onClick={onViewAll} /> : undefined} state={!loading && trainings.length === 0 ? "empty" : "default"} stateProps={{ title: "Aucune formation en cours.", description: null }} className={`dashboard-trainings ${className}`.trim()}>
      {rows}
    </Panel>
  );
};
