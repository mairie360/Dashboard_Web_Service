"use client";
import { Caption, RetryButton } from "@mairie360/lib-components/primitives";

export interface DashboardNoticesProps {
  error: string;
  logoutError: string;
  loading: boolean;
  /** At least one BFF source answered unavailable. */
  hasUnavailableSource: boolean;
  /** Events received with an unreadable date or time. */
  unusableEventCount: number;
  /** The last confirmed cards are still displayed under the error. */
  hasData: boolean;
  onReload: () => void;
}

/** Label of the single recovery action, from the most severe situation. */
export const reloadLabel = ({ error, unusableEventCount }: Pick<DashboardNoticesProps, "error" | "unusableEventCount">) =>
  error ? "Réessayer le chargement" : unusableEventCount > 0 ? "Actualiser les dates illisibles" : "Actualiser les données indisponibles";

/** Inline notice styled like the lib Alert tones (an announced paragraph, not a region). */
export const noticeClass = (tone: "danger" | "warning") =>
  `dashboard-notice rounded-md border-l-4 px-4 py-3 text-sm ${tone === "danger" ? "border-[var(--mairie-error-text)] bg-[var(--mairie-error-surface)] text-[var(--mairie-error-text)]" : "border-[var(--mairie-warning-text)] bg-[var(--mairie-warning-surface)] text-[var(--mairie-warning-text)]"}`;

/** The alerts above the dashboard and their one recovery action (Figma 03 « données indisponibles »). */
export const DashboardNotices = ({ error, logoutError, loading, hasUnavailableSource, unusableEventCount, hasData, onReload }: DashboardNoticesProps) => {
  const recoverable = Boolean(error) || hasUnavailableSource || unusableEventCount > 0;
  return (
    <div className="dashboard-notices space-y-3">
      {logoutError && <p role="alert" className={noticeClass("danger")}>{logoutError}</p>}
      {error && <p role="alert" className={noticeClass("danger")}>{error}</p>}
      {hasUnavailableSource && <p role="status" className={noticeClass("warning")}>Certaines données sont temporairement indisponibles.</p>}
      {unusableEventCount > 0 && <p role="status" className={noticeClass("warning")}>Certains événements reçus ont une date ou une heure illisible et ne sont pas affichés.</p>}
      {recoverable && (
        <div className="flex flex-wrap items-center gap-3">
          <RetryButton label={reloadLabel({ error, unusableEventCount })} variant="outline" size="s" loading={loading} onClick={onReload} />
          {loading && <Caption role="status" tone="default">Actualisation du tableau de bord…</Caption>}
          {hasData && error && <Caption>Les dernières données reçues restent affichées.</Caption>}
        </div>
      )}
    </div>
  );
};
