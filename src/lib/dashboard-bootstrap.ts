import type { DashboardBootstrap } from '@mairie360/bff-dashboard-openapi/model';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isSourceState = (source: unknown) => source === "available" || source === "unavailable";
const isOptionalText = (value: unknown) => value === undefined || value === null || typeof value === "string";
const isCount = (value: unknown) => typeof value === "number" && Number.isInteger(value) && value >= 0;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** A real calendar day (`YYYY-MM-DD`): `2026-11-99` or `2026-02-30` are not. */
const isCalendarDay = (value: unknown): value is string => {
  if (typeof value !== "string" || !DAY.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
/** Both ends are calendar days, the first not after the last. */
const isDatedPeriod = (value: unknown): value is { from: string; to: string } =>
  isRecord(value) && isCalendarDay(value.from) && isCalendarDay(value.to) && value.from <= value.to;
/** A dated period, or the neutral `{ from: "", to: "" }` this projection gives a BFF without one. */
const isPeriod = (value: unknown): value is { from: string; to: string } =>
  isDatedPeriod(value) || (isRecord(value) && value.from === "" && value.to === "");

/**
 * The events indicator of the month: a count or null, over a `{ from, to }` period. A BFF that does not send them
 * yet stays usable (no indicator, neutral empty period, also accepted when the projection is read back); a malformed
 * value is refused like a non-finite `totalProjects`.
 */
function hasUsableMonthMetrics(metrics: Record<string, unknown>): boolean {
  if (metrics.eventsThisMonth !== undefined && metrics.eventsThisMonth !== null && !isCount(metrics.eventsThisMonth)) return false;
  return metrics.eventsPeriod === undefined || isPeriod(metrics.eventsPeriod);
}

/** The month indicator of a usable bootstrap, null without a count or a period (older BFF). */
function monthMetrics(metrics: unknown): Pick<DashboardBootstrap["metrics"], "eventsThisMonth" | "eventsPeriod"> {
  const record = isRecord(metrics) ? metrics : {};
  const period = isDatedPeriod(record.eventsPeriod) ? { from: record.eventsPeriod.from, to: record.eventsPeriod.to } : null;
  return {
    eventsThisMonth: period && isCount(record.eventsThisMonth) ? record.eventsThisMonth as number : null,
    eventsPeriod: period ?? { from: "", to: "" },
  };
}

/**
 * MAIR-825 fields (`userLastName`, `userRole`, `communeName`, `trainings`, `sources.trainings`) are checked
 * when present; an older BFF that does not send them yet stays usable (`withDefaults` fills them in).
 */
function hasUsableV2Fields(value: Record<string, unknown>, sources: Record<string, unknown>): boolean {
  if (![value.userLastName, value.userRole, value.communeName].every(isOptionalText)) return false;
  if (sources.trainings !== undefined && !isSourceState(sources.trainings)) return false;
  // MAIR-1106: the unread total of the Messagerie badge, a count or null.
  if (sources.messages !== undefined && !isSourceState(sources.messages)) return false;
  if (value.unreadMessages !== undefined && value.unreadMessages !== null && !isCount(value.unreadMessages)) return false;
  if (value.trainings === undefined) return true;
  return Array.isArray(value.trainings) && value.trainings.every(training => isRecord(training) &&
    typeof training.id === "string" && typeof training.title === "string" &&
    ["todo", "in-progress", "done"].some(status => training.status === status) &&
    isCount(training.completedModules) && isCount(training.totalModules) &&
    typeof training.progress === "number" && Number.isFinite(training.progress) &&
    isOptionalText(training.dueDate));
}

// Check the fields consumed by the cards before replacing a confirmed read.
// Display-date validation and optional summary metrics keep their existing policy.
export function isUsableBootstrap(value: unknown): value is DashboardBootstrap {
  if (!isRecord(value) || typeof value.userFirstName !== "string" ||
      !Array.isArray(value.projects) || !Array.isArray(value.tasks) ||
      !Array.isArray(value.events) || !isRecord(value.sources)) return false;
  if (![value.sources.projects, value.sources.tasks, value.sources.calendar].every(isSourceState)) return false;
  if (!hasUsableV2Fields(value, value.sources)) return false;
  if (isRecord(value.metrics) && !hasUsableMonthMetrics(value.metrics)) return false;
  return value.projects.every(project => isRecord(project) &&
    ["id", "title", "dueDate"].every(key => typeof project[key] === "string") &&
    typeof project.progress === "number" && Number.isFinite(project.progress) &&
    ["todo", "in-progress", "review", "done"].some(status => project.status === status)) &&
    value.tasks.every(task => isRecord(task) &&
      ["id", "projectId", "title", "dueDate"].every(key => typeof task[key] === "string") &&
      ["low", "medium", "high"].some(priority => task.priority === priority)) &&
    value.events.every(event => isRecord(event) &&
      (typeof event.id === "string" || (typeof event.id === "number" && Number.isFinite(event.id))) &&
      typeof event.title === "string" && typeof event.date === "string" &&
      (event.startTime === undefined || typeof event.startTime === "string") &&
      (event.location === undefined || typeof event.location === "string"));
}

/**
 * A usable bootstrap of an older BFF, completed with the neutral values: no role, no commune, no trainings
 * (MAIR-825), no training due date (MAIR-1110), no unread badge (MAIR-1106), no events indicator of the month.
 */
export function withDefaults(value: DashboardBootstrap): DashboardBootstrap {
  const partial = value as Partial<DashboardBootstrap> & DashboardBootstrap;
  return {
    ...value,
    userLastName: partial.userLastName ?? "",
    userRole: partial.userRole ?? null,
    communeName: partial.communeName ?? null,
    trainings: (partial.trainings ?? []).map((training) => ({ ...training, dueDate: training.dueDate ?? null })),
    unreadMessages: partial.unreadMessages ?? null,
    metrics: { ...partial.metrics, totalProjects: partial.metrics?.totalProjects ?? null, ...monthMetrics(partial.metrics) },
    sources: { ...value.sources, trainings: partial.sources.trainings ?? "unavailable", messages: partial.sources.messages ?? "unavailable" },
  };
}

/** Serialize the published view fields, never an arbitrary upstream object. */
export function selectDashboardBootstrap(value: unknown): DashboardBootstrap | null {
  if (!isUsableBootstrap(value)) return null;
  if (!value.tasks.every(task => typeof task.completed === 'boolean')) return null;
  if (!isRecord(value.metrics) || (value.metrics.totalProjects !== null &&
    (typeof value.metrics.totalProjects !== 'number' || !Number.isFinite(value.metrics.totalProjects)))) return null;
  const complete = withDefaults(value);
  return {
    userFirstName: value.userFirstName,
    userLastName: complete.userLastName,
    userRole: complete.userRole,
    communeName: complete.communeName,
    trainings: complete.trainings.map(({ id, title, status, completedModules, totalModules, progress, dueDate }) => ({ id, title, status, completedModules, totalModules, progress, dueDate })),
    unreadMessages: complete.unreadMessages,
    projects: value.projects.map(({ id, title, progress, status, dueDate }) => ({ id, title, progress, status, dueDate })),
    tasks: value.tasks.map(({ id, projectId, title, dueDate, priority, completed }) => ({ id, projectId, title, dueDate, priority, completed })),
    events: value.events.map(({ id, title, date, startTime, location }) => ({ id, title, date,
      ...(startTime === undefined ? {} : { startTime }), ...(location === undefined ? {} : { location }) })),
    metrics: { totalProjects: value.metrics.totalProjects, ...monthMetrics(value.metrics) },
    sources: { projects: value.sources.projects, tasks: value.sources.tasks, calendar: value.sources.calendar, trainings: complete.sources.trainings, messages: complete.sources.messages },
  };
}
