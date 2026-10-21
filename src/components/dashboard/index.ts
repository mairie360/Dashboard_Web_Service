// MAIR-607: the dashboard module and its panels used to be published by the
// library's dashboard entry. Dashboard is their only consumer, so they live
// here now; the library keeps only components shared by several fronts.
export { DashboardModule } from './DashboardModule';
export type { DashboardModuleProps } from './DashboardModule';
export { DashboardMetricCards } from './DashboardMetricCards';
export { DashboardPendingTasks } from './DashboardPendingTasks';
export { DashboardPerformancePanel } from './DashboardPerformancePanel';
export { DashboardQuickActions } from './DashboardQuickActions';
export { DashboardRecentProjects } from './DashboardRecentProjects';
export { DashboardUpcomingEvents } from './DashboardUpcomingEvents';
export type * from './types';
