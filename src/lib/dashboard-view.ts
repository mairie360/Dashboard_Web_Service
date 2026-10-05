import type { ComponentProps } from 'react';
import type { DashboardModule } from '@mairie360/lib-components';
import type { DashboardBootstrap } from '@mairie360/bff-dashboard-openapi/model';

// Passage de la réponse /dashboard/bootstrap (contrat BFF_Dashboard) aux props de DashboardModule.
// Fonctions pures, sans DOM : testées dans tests/dashboard-view.test.cjs.

// Type du contrat publié (paquet @mairie360/bff-dashboard-openapi épinglé en X.X.X).
export type { DashboardBootstrap };
type ModuleProps = ComponentProps<typeof DashboardModule>;

// BFF Calendar accepte YYYY-MM-DD ou DD-MM-YYYY, que BFF_Dashboard relaie tels quels.
const isoDate = (date: string) => date.replace(/^(\d{2})-(\d{2})-(\d{4})$/, '$3-$2-$1');

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_START = /^(\d{4}-\d{2}-\d{2})[Tt]/;
const CLOCK_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const isCivilDate = (value: string) => {
  if (!DATE_ONLY.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= monthDays[month - 1];
};
const frenchDate = (timeZone: string) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone });
// Une date seule est lue en UTC par Date : elle est formatée en UTC pour ne pas changer de jour.
const dateOnlyFormat = frenchDate('UTC');
// Les échéances BFF Project sont des instants ISO 8601 (toISOString) : jour affiché à l'heure de Paris.
const instantFormat = frenchDate('Europe/Paris');

/** Échéance numérique de la référence (« 01/12/2026 ») ; une valeur non reconnue est affichée telle quelle. */
export function formatDueDate(value: string): string {
  const normalized = isoDate(value.trim());
  const dateOnly = DATE_ONLY.test(normalized);
  const civilDate = dateOnly ? normalized : ISO_DATE_TIME_START.exec(normalized)?.[1];
  // Date.parse rolls impossible days forward and guesses dates from free text.
  if (!civilDate || !isCivilDate(civilDate)) return value;
  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) return value;
  return (dateOnly ? dateOnlyFormat : instantFormat).format(timestamp);
}

export function toDashboardModuleData(data: DashboardBootstrap) {
  const events = data.events.flatMap((event) => {
    const date = isoDate(event.date);
    const time = event.startTime ?? '00:00';
    if (!isCivilDate(date) || !CLOCK_TIME.test(time)) return [];
    const startsAt = `${date}T${time}:00`;
    // Keep the existing local-clock representation and the Intl parse guard.
    return Number.isNaN(Date.parse(startsAt)) ? [] : [{ id: String(event.id), title: event.title, location: event.location ?? '', startsAt }];
  });
  return {
    hasUnavailableSource: Object.values(data.sources).includes('unavailable'),
    unusableEventCount: data.events.length - events.length,
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
    events,
  } satisfies Pick<ModuleProps, 'projects' | 'tasks' | 'events'> & Record<string, unknown>;
}
