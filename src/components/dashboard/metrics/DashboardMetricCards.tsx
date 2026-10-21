"use client";
import React from "react";
import { MetricCard } from "@mairie360/lib-components/primitives";

import type { DashboardMetric } from "../types";

export interface DashboardMetricCardsProps extends React.HTMLAttributes<HTMLDivElement> {
  metrics?: DashboardMetric[];
}

/** Trend direction of a dashboard metric for the lib `MetricCard`. */
export const metricTrend = (metric: DashboardMetric): "up" | "down" | "none" =>
  !metric.trend ? "none" : metric.trendTone === "negative" ? "down" : metric.trendTone === "neutral" ? "none" : "up";

/** The headline indicators on lib `MetricCard`s (Figma Base/MetricCard). */
export const DashboardMetricCards = ({ metrics = [], className = "", ...props }: DashboardMetricCardsProps) => (
  <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`.trim()} {...props}>
    {metrics.map((metric) => (
      <MetricCard key={metric.id} label={metric.label} value={metric.value} icon={metric.icon} trend={metricTrend(metric)} trendLabel={metric.trend} data-tone={metric.tone} />
    ))}
  </div>
);
