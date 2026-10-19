import type { DashboardBootstrap } from '@mairie360/bff-dashboard-openapi/model';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

// Check the fields consumed by the cards before replacing a confirmed read.
// Display-date validation and optional summary metrics keep their existing policy.
export function isUsableBootstrap(value: unknown): value is DashboardBootstrap {
  if (!isRecord(value) || typeof value.userFirstName !== "string" ||
      !Array.isArray(value.projects) || !Array.isArray(value.tasks) ||
      !Array.isArray(value.events) || !isRecord(value.sources)) return false;
  if (![value.sources.projects, value.sources.tasks, value.sources.calendar]
    .every(source => source === "available" || source === "unavailable")) return false;
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

/** Serialize the published view fields, never an arbitrary upstream object. */
export function selectDashboardBootstrap(value: unknown): DashboardBootstrap | null {
  if (!isUsableBootstrap(value)) return null;
  if (!value.tasks.every(task => typeof task.completed === 'boolean')) return null;
  if (!isRecord(value.metrics) || (value.metrics.totalProjects !== null &&
    (typeof value.metrics.totalProjects !== 'number' || !Number.isFinite(value.metrics.totalProjects)))) return null;
  return {
    userFirstName: value.userFirstName,
    projects: value.projects.map(({ id, title, progress, status, dueDate }) => ({ id, title, progress, status, dueDate })),
    tasks: value.tasks.map(({ id, projectId, title, dueDate, priority, completed }) => ({ id, projectId, title, dueDate, priority, completed })),
    events: value.events.map(({ id, title, date, startTime, location }) => ({ id, title, date,
      ...(startTime === undefined ? {} : { startTime }), ...(location === undefined ? {} : { location }) })),
    metrics: { totalProjects: value.metrics.totalProjects },
    sources: { projects: value.sources.projects, tasks: value.sources.tasks, calendar: value.sources.calendar },
  };
}
