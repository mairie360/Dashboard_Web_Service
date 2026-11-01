"use client";
import { Help, Icon, Metric, PanelTitle } from "@mairie360/lib-components/primitives";

import type { DashboardPerformanceMetric } from '@/components/dashboard-types';

const tones = {
  green: { surface: "var(--mairie-success-surface)", ink: "var(--mairie-success-text)", tone: "success" as const },
  blue: { surface: "var(--mairie-accent-surface)", ink: "var(--mairie-accent)", tone: "primary" as const },
  orange: { surface: "var(--mairie-warning-surface)", ink: "var(--mairie-warning-text)", tone: "warning" as const },
};

/** One performance indicator: icon disc, label, value and description. */
export const PerformanceMetric = ({ metric }: { metric: DashboardPerformanceMetric }) => {
  const tone = tones[metric.tone];
  return (
    <article className="text-center" data-tone={metric.tone}>
      <div className="mx-auto flex size-16 items-center justify-center rounded-full" style={{ background: tone.surface, color: tone.ink }}>
        <Icon icon={metric.icon} size="xl" />
      </div>
      <PanelTitle className="mt-3">{metric.label}</PanelTitle>
      <Metric as="div" size="l" tone={tone.tone} className="mt-1">{metric.value}</Metric>
      <Help className="mt-1">{metric.description}</Help>
    </article>
  );
};
