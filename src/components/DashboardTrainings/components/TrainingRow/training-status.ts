import type { Status } from "@mairie360/lib-components/primitives";

import type { DashboardTraining, DashboardTrainingStatus } from '@/components/dashboard-types';

/** Training statuses on the shared status pills (« À faire », « En cours », « Terminé »). */
export const trainingStatusBadge: Record<DashboardTrainingStatus, Status> = { todo: "todo", "in-progress": "inprogress", done: "done" };

/** « Module x sur y »: the module the agent is on (the last one once everything is done). */
export function trainingModuleLabel({ completedModules, totalModules }: Pick<DashboardTraining, "completedModules" | "totalModules">): string {
  if (totalModules <= 0) return "Aucun module";
  return `Module ${Math.min(totalModules, completedModules + 1)} sur ${totalModules}`;
}
