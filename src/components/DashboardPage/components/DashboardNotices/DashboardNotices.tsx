"use client";
import { Caption, ErrorAlert, RetryButton, WarningAlert, useToast } from "@mairie360/lib-components/primitives";

import type { DashboardReadOutcome } from '../../use-dashboard-data';
import { reloadToast } from './reload-toast';

export interface DashboardNoticesProps {
  /** A read failed: the front's own wording only (a service message never reaches the agent, MAIR-915). */
  error: string;
  logoutError: string;
  loading: boolean;
  /** At least one BFF source answered unavailable. */
  hasUnavailableSource: boolean;
  /** Events received with an unreadable date or time. */
  unusableEventCount: number;
  /** The last confirmed cards are still displayed under the error. */
  hasData: boolean;
  onReload: () => Promise<DashboardReadOutcome | null> | void;
}

/** Fixed texts of the alerts (Figma F1/F2/F3/F6): no service message, no HTTP status reaches the agent. */
export const NOTICE_TEXTS = {
  unavailableSource: "Certaines données sont temporairement indisponibles.",
  readFailed: "Le tableau de bord est temporairement indisponible.",
  logoutFailed: "La déconnexion est temporairement indisponible.",
  unusableEvents: "Certains événements reçus ont une date ou une heure illisible et ne sont pas affichés.",
} as const;

/** Label of the single recovery action, from the most severe situation. */
export const reloadLabel = ({ error, unusableEventCount }: Pick<DashboardNoticesProps, "error" | "unusableEventCount">) =>
  error ? "Réessayer le chargement" : unusableEventCount > 0 ? "Actualiser les dates illisibles" : "Actualiser les données indisponibles";

/**
 * The alerts above the dashboard on the lib Alert (size m, not dismissible, MAIR-915), their one recovery
 * action and the toast that announces its result. Errors are `alert`, warnings `status` (lib roles).
 */
export const DashboardNotices = ({ error, logoutError, loading, hasUnavailableSource, unusableEventCount, hasData, onReload }: DashboardNoticesProps) => {
  const toast = useToast();
  const recoverable = Boolean(error) || hasUnavailableSource || unusableEventCount > 0;
  const recover = async () => {
    const outcome = await onReload();
    const result = reloadToast(outcome ?? null, hasData);
    if (!result) return;
    const options = { title: result.title, duration: 5000, showProgress: true };
    if (result.tone === "success") toast.success(result.message, options);
    else toast.error(result.message, options);
  };
  return (
    <div className="dashboard-notices space-y-3">
      {logoutError && <ErrorAlert size="m" title={NOTICE_TEXTS.logoutFailed} />}
      {error && <ErrorAlert size="m" title={NOTICE_TEXTS.readFailed} description={error !== NOTICE_TEXTS.readFailed ? error : undefined} />}
      {hasUnavailableSource && <WarningAlert size="m" title={NOTICE_TEXTS.unavailableSource} />}
      {unusableEventCount > 0 && <WarningAlert size="m" title={NOTICE_TEXTS.unusableEvents} />}
      {recoverable && (
        <div className="flex flex-wrap items-center gap-3">
          <RetryButton label={reloadLabel({ error, unusableEventCount })} variant="outline" size="s" loading={loading} onClick={() => void recover()} />
          {loading && <Caption role="status" tone="default">Actualisation du tableau de bord…</Caption>}
          {hasData && error && <Caption>Les dernières données reçues restent affichées.</Caption>}
        </div>
      )}
    </div>
  );
};
