export const joinDashboardClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const clampDashboardProgress = (value: number) => Math.min(100, Math.max(0, value));

export const dashboardCardActionClasses =
  'rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface-raised)] px-3 py-2 text-sm font-medium text-[var(--mairie-text)] hover:bg-[var(--mairie-surface)]';
