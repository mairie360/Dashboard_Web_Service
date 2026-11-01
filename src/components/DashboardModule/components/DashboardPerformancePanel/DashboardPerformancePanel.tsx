"use client";
import React from "react";
import { Panel } from "@mairie360/lib-components/primitives";

import type { DashboardPerformanceMetric } from '@/components/dashboard-types';
import { PerformanceMetric } from './components/PerformanceMetric';

export interface DashboardPerformancePanelProps extends React.HTMLAttributes<HTMLElement> {
  metrics?: DashboardPerformanceMetric[];
}

/** The performance overview panel. */
export const DashboardPerformancePanel = ({ metrics = [], className = "", ...props }: DashboardPerformancePanelProps) => (
  <Panel {...props} title="Aperçu des performances" className={`dashboard-performance ${className}`.trim()}>
    <div className="grid gap-7 sm:grid-cols-3">
      {metrics.map((metric) => <PerformanceMetric key={metric.id} metric={metric} />)}
    </div>
  </Panel>
);
