"use client";
import { BookOpen } from "lucide-react";
import { BodySmall, Icon, ProgressMeter, StatusBadge, Text } from "@mairie360/lib-components/primitives";

import type { DashboardTraining } from '@/components/dashboard-types';
import { trainingModuleLabel, trainingStatusBadge } from './training-status';

export interface TrainingRowProps {
  training: DashboardTraining;
  onSelect?: (training: DashboardTraining) => void;
}

/**
 * One training as a compact row (Figma Dashboard/TrainingRow, MAIR-1110): title and status pill, then
 * « Module x sur y », the progress track in the training module colour and its percentage. The contract
 * gives no deadline, so « avant le <date> » is not shown.
 */
export const TrainingRow = ({ training, onSelect }: TrainingRowProps) => {
  const progress = Math.min(100, Math.max(0, Number.isFinite(training.progress) ? training.progress : 0));
  return (
    <button type="button" disabled={!onSelect} data-training-status={training.status} className="dashboard-row dashboard-training-row" onClick={() => onSelect?.(training)}>
      <span className="dashboard-row-line">
        <Text weight="semibold" truncate>{training.title}</Text>
        <StatusBadge status={trainingStatusBadge[training.status]} size="s" />
      </span>
      <span className="dashboard-row-line">
        <BodySmall as="span" tone="muted" className="dashboard-row-meta"><Icon icon={BookOpen} size="xs" />{trainingModuleLabel(training)}</BodySmall>
        <ProgressMeter label="Progression" value={progress} size="s" className="dashboard-row-progress dashboard-training-progress" />
      </span>
    </button>
  );
};
