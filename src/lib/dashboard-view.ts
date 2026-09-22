import type { ComponentProps } from 'react';
import type { DashboardModule } from '@mairie360/lib-components';
import type { DashboardBootstrap } from '@mairie360/bff-dashboard-openapi/model';

// Passage de la réponse /dashboard/bootstrap (contrat BFF_Dashboard) aux props de DashboardModule.
// Fonctions pures, sans DOM : testées dans tests/dashboard-view.test.cjs.

// Type du contrat publié (paquet @mairie360/bff-dashboard-openapi épinglé en X.X.X).
export type { DashboardBootstrap };
type ModuleProps = ComponentProps<typeof DashboardModule>;
export type DashboardQuickActionId = Parameters<NonNullable<ModuleProps['onQuickAction']>>[0];

// A URL is undefined when the instance does not configure that front.
export type FrontUrls = { project?: string; calendar?: string; files?: string; message?: string };

// BFF Calendar accepte YYYY-MM-DD ou DD-MM-YYYY, que BFF_Dashboard relaie tels quels.
const isoDate = (date: string) => date.replace(/^(\d{2})-(\d{2})-(\d{4})$/, '$3-$2-$1');

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const frenchDate = (timeZone: string) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone });
// Une date seule est lue en UTC par Date : elle est formatée en UTC pour ne pas changer de jour.
const dateOnlyFormat = frenchDate('UTC');
// Les échéances BFF Project sont des instants ISO 8601 (toISOString) : jour affiché à l'heure de Paris.
const instantFormat = frenchDate('Europe/Paris');

/** Échéance lisible en français (« 1 déc. 2026 ») ; une valeur non reconnue est affichée telle quelle. */
export function formatDueDate(value: string): string {
  const normalized = isoDate(value.trim());
  const timestamp = Date.parse(normalized);
  if (!normalized || Number.isNaN(timestamp)) return value;
  return (DATE_ONLY.test(normalized) ? dateOnlyFormat : instantFormat).format(timestamp);
}

export const REPORTS_UNAVAILABLE = 'Les rapports ne sont pas encore disponibles.';

export function toDashboardModuleData(data: DashboardBootstrap) {
  return {
    hasUnavailableSource: Object.values(data.sources).includes('unavailable'),
    totalProjectsLabel: data.metrics.totalProjects ?? 'Indisponible',
    projects: data.projects.map((project) => ({
      id: project.id,
      name: project.title,
      progress: project.progress,
      status: project.status === 'done' ? 'completed' as const : 'in-progress' as const,
      dueDate: formatDueDate(project.dueDate),
    })),
    tasks: data.tasks.map((task) => ({
      id: `${task.projectId}:${task.id}`,
      title: task.title,
      dueLabel: task.dueDate.trim() ? formatDueDate(task.dueDate) : 'Sans échéance',
      priority: task.priority,
    })),
    events: data.events.flatMap((event) => {
      const startsAt = `${isoDate(event.date)}T${event.startTime ?? '00:00'}:00`;
      // DashboardModule formate startsAt avec Intl : une date invalide ferait planter toute la page.
      return Number.isNaN(Date.parse(startsAt)) ? [] : [{ id: String(event.id), title: event.title, location: event.location ?? '', startsAt }];
    }),
  } satisfies Pick<ModuleProps, 'projects' | 'tasks' | 'events'> & Record<string, unknown>;
}

/** Destination of a quick action: another front's URL (undefined when not configured), or `null` when the action is not available. */
export function quickActionTarget(action: DashboardQuickActionId, urls: FrontUrls): string | null | undefined {
  if (action === 'view-reports') return null;
  if (action === 'schedule-event') return urls.calendar;
  if (action === 'new-document') return urls.files;
  return urls.message;
}
