"use client";
import type { ReactNode } from "react";
import { DataState, LinkButton, Panel, WarningAlert } from "@mairie360/lib-components/primitives";

export type DashboardPanelKind = "projects" | "tasks" | "events" | "trainings";
export interface DashboardPanelProps {
  /** The tile title alone: no count after it, as in the reference screen. */
  title: string;
  /** Label of the destination link (« Voir les projets »). */
  action: string;
  /** Destination; without it the action renders disabled. */
  href?: string;
  kind: DashboardPanelKind;
  empty: boolean;
  unavailable: boolean;
  /** The rows are skeletons: the tile is busy and shows no empty / unavailable state (MAIR-899). */
  loading?: boolean;
  children: ReactNode;
  className?: string;
  /** « Réessayer » of the unavailable state (MAIR-1255): reloads the dashboard. */
  onRetry?: () => void;
}

/**
 * Texts of a tile (MAIR-1255, artifact `dataState`): the empty state names what will appear there, the unavailable
 * state names the module that did not answer; `unavailable` stays the sentence of the in-tile alert when rows remain.
 */
export const panelMessages: Record<DashboardPanelKind, { empty: string; emptyHint: string; unavailable: string; unavailableTitle: string; unavailableHint: string }> = {
  projects: { empty: "Aucun projet récent.", emptyHint: "Les projets que vous suivez apparaîtront ici.", unavailable: "Les projets sont temporairement indisponibles.", unavailableTitle: "Projets indisponibles.", unavailableHint: "Le module Projets ne répond pas." },
  tasks: { empty: "Aucune tâche en attente.", emptyHint: "Les tâches qui vous sont assignées apparaîtront ici.", unavailable: "Les tâches sont temporairement indisponibles.", unavailableTitle: "Tâches indisponibles.", unavailableHint: "Le module Projets ne répond pas." },
  events: { empty: "Aucun événement à venir.", emptyHint: "Les prochains rendez-vous de votre agenda apparaîtront ici.", unavailable: "Les événements sont temporairement indisponibles.", unavailableTitle: "Événements indisponibles.", unavailableHint: "Le calendrier ne répond pas." },
  trainings: { empty: "Aucune formation en cours.", emptyHint: "Les formations qui vous sont proposées apparaîtront ici.", unavailable: "Les formations sont temporairement indisponibles.", unavailableTitle: "Formations indisponibles.", unavailableHint: "Le module E-learning ne répond pas." },
};

/** Action of a tile: a text link to the module, without arrow (MAIR-1107), or disabled when its URL is not configured. */
export const DashboardPanelAction = ({ label, href }: { label: string; href?: string }) => (
  <LinkButton className="dashboard-panel-action" size="s" href={href} disabled={!href} title={href ? undefined : "Destination temporairement indisponible"}>{label}</LinkButton>
);

/**
 * One dashboard tile on the lib `Panel` (Figma Base/Panel): header with title and module link,
 * then the compact rows, or the centred empty / unavailable `DataState` (MAIR-1107).
 */
export default function DashboardPanel({ title, action, href, kind, empty, unavailable, loading = false, children, className = "", onRetry }: DashboardPanelProps) {
  const messages = panelMessages[kind];
  const showState = !loading && empty;
  return (
    <Panel divider title={title} action={<DashboardPanelAction label={action} href={href} />} data-loading={loading || undefined} className={`dashboard-panel ${className}`.trim()} data-kind={kind} data-empty={showState || undefined} data-unavailable={(!loading && unavailable) || undefined}>
      {!loading && unavailable && !empty ? <WarningAlert size="s" title={messages.unavailable} className="dashboard-source-notice mb-4" /> : null}
      {showState
        // MAIR-1255 (artifact): the illustrated state (size m) with its hint, and « Réessayer » when the module is down.
        ? unavailable
          ? <DataState state="unavailable" size="m" title={messages.unavailableTitle} description={messages.unavailableHint} onRetry={onRetry} className="dashboard-empty-state" />
          : <DataState state="empty" size="m" title={messages.empty} description={messages.emptyHint} className="dashboard-empty-state" />
        : <div className="dashboard-panel-content">{children}</div>}
    </Panel>
  );
}
