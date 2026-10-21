import type { Status } from "@mairie360/lib-components/primitives";

import type { DashboardProjectStatus } from '@/components/dashboard-types';

/** Dashboard project statuses mapped to the shared status pills (same colour in every front). */
export const projectStatusBadge: Record<DashboardProjectStatus, Status> = {
  "in-progress": "inprogress",
  completed: "done",
  paused: "draft",
};

export const projectStatusLabels: Record<DashboardProjectStatus, string> = {
  "in-progress": "En cours",
  completed: "Terminé",
  paused: "En pause",
};

export const clampProgress = (value: number) => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
