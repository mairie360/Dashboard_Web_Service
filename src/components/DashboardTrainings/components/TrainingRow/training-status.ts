import type { Status } from "@mairie360/lib-components/primitives";

import type { DashboardTraining, DashboardTrainingStatus } from '@/components/dashboard-types';

/** Training statuses on the shared status pills (« À faire », « En cours », « Terminé »). */
export const trainingStatusBadge: Record<DashboardTrainingStatus, Status> = { todo: "todo", "in-progress": "inprogress", done: "done" };

/**
 * « Module x sur y »: the module the agent is on (the last one once everything is done), followed by
 * « · avant le <date> » when the training has a due date (MAIR-1110).
 */
export function trainingModuleLabel({ completedModules, totalModules, dueLabel }: Pick<DashboardTraining, "completedModules" | "totalModules" | "dueLabel">): string {
  const modules = totalModules <= 0 ? "Aucun module" : `Module ${Math.min(totalModules, completedModules + 1)} sur ${totalModules}`;
  return dueLabel ? `${modules} · avant le ${dueLabel}` : modules;
}
