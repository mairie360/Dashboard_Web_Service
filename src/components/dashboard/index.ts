// MAIR-607: the dashboard module and its panels are Dashboard's own code.
// MAIR-608: one folder per panel, each split into list + row sub-components on the lib primitives.
export { DashboardModule } from './DashboardModule';
export type { DashboardModuleProps } from './DashboardModule';
export { DashboardMetricCards, metricTrend } from './metrics/DashboardMetricCards';
export { DashboardPendingTasks } from './tasks/DashboardPendingTasks';
export { TaskRow } from './tasks/TaskRow';
export { DashboardPerformancePanel } from './performance/DashboardPerformancePanel';
export { PerformanceMetric } from './performance/PerformanceMetric';
export { DashboardQuickActions } from './quick-actions/DashboardQuickActions';
export { QuickActionButton } from './quick-actions/QuickActionButton';
export { DashboardRecentProjects } from './projects/DashboardRecentProjects';
export { ProjectRow } from './projects/ProjectRow';
export { clampProgress, projectStatusBadge, projectStatusLabels } from './projects/project-status';
export { DashboardUpcomingEvents } from './events/DashboardUpcomingEvents';
export { EventRow } from './events/EventRow';
export { EventDateBadge } from './events/EventDateBadge';
export { byStart, eventDateParts } from './events/event-date';
export { default as DashboardPanel, DashboardPanelAction, panelMessages } from './panels/DashboardPanel';
export { PanelViewAll } from './panels/PanelViewAll';
export { DashboardHeader, dashboardGreeting } from './page/DashboardHeader';
export { DashboardNotices, reloadLabel } from './page/DashboardNotices';
export { DashboardLoading } from './page/DashboardLoading';
export { DashboardGrid } from './page/DashboardGrid';
export { default as DashboardPage } from './page/DashboardPage';
export { useDashboardData } from './page/use-dashboard-data';
export { calendarEventHref, dashboardUrls, navigateTo, projectHref } from './page/dashboard-links';
export type * from './types';
