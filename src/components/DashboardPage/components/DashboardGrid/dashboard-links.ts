import { frontUrl } from '@/lib/front-urls';
import { validatedFrontHref } from '@/lib/navigation';

/**
 * Destinations of the dashboard actions, resolved on use from the runtime
 * environment (src/lib/front-urls.ts), never inlined at build time.
 */
export const dashboardUrls = {
  get project() { return validatedFrontHref(frontUrl("PROJECT_FRONT_URL")); },
  get calendar() { return validatedFrontHref(frontUrl("CALENDAR_FRONT_URL")); },
  get elearning() { return validatedFrontHref(frontUrl("ELEARNING_FRONT_URL")); },
};

export const navigateTo = (href: string | undefined) => { if (href) window.location.href = href; };

/** Project front, optionally focused on one task of the project. */
export function projectHref(projectId: string, taskId?: string): string | undefined {
  const projectUrl = dashboardUrls.project;
  if (!projectUrl || !projectId) return undefined;
  const destination = new URL(projectUrl);
  destination.searchParams.set("project", projectId);
  if (taskId) destination.searchParams.set("task", taskId);
  return destination.toString();
}

/** Calendar front opened on the day of the event with the event selected. */
export function calendarEventHref(event: { id: string; startsAt: string }): string | undefined {
  const calendarUrl = dashboardUrls.calendar;
  if (!calendarUrl) return undefined;
  const destination = new URL(calendarUrl);
  destination.searchParams.set("date", event.startsAt.slice(0, 10));
  destination.searchParams.set("event", event.id);
  return destination.toString();
}

/** E-learning front opened on one training (`?course=<formation id>`, BFF_Elearning ids; MAIR-1110). */
export function trainingHref(trainingId: string): string | undefined {
  const elearningUrl = dashboardUrls.elearning;
  const course = /^training-(\d+)$/.exec(trainingId)?.[1];
  if (!elearningUrl || !course) return elearningUrl;
  const destination = new URL(elearningUrl);
  destination.searchParams.set("course", course);
  return destination.toString();
}
