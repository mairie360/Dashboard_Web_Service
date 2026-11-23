"use client";
import type { ReactNode } from "react";
import { DataState, LinkButton, Panel, WarningAlert } from "@mairie360/lib-components/primitives";

export type DashboardPanelKind = "projects" | "tasks" | "events" | "trainings";
export interface DashboardPanelProps {
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
}

export const panelMessages: Record<DashboardPanelKind, { empty: string; unavailable: string }> = {
  projects: { empty: "Aucun projet récent.", unavailable: "Les projets sont temporairement indisponibles." },
  tasks: { empty: "Aucune tâche en attente.", unavailable: "Les tâches sont temporairement indisponibles." },
  events: { empty: "Aucun événement à venir.", unavailable: "Les événements sont temporairement indisponibles." },
  trainings: { empty: "Aucune formation en cours.", unavailable: "Les formations sont temporairement indisponibles." },
};

/** Action of a tile: a text link to the module, without arrow (MAIR-1107), or disabled when its URL is not configured. */
export const DashboardPanelAction = ({ label, href }: { label: string; href?: string }) => (
  <LinkButton className="dashboard-panel-action" size="s" href={href} disabled={!href} title={href ? undefined : "Destination temporairement indisponible"}>{label}</LinkButton>
);

/**
 * One dashboard tile on the lib `Panel` (Figma Base/Panel): header with title and module link,
 * then the compact rows, or the centred empty / unavailable `DataState` (MAIR-1107).
 */
export default function DashboardPanel({ title, action, href, kind, empty, unavailable, loading = false, children, className = "" }: DashboardPanelProps) {
  const messages = panelMessages[kind];
  const showState = !loading && empty;
  return (
    <Panel title={title} action={<DashboardPanelAction label={action} href={href} />} data-loading={loading || undefined} className={`dashboard-panel ${className}`.trim()} data-kind={kind} data-empty={showState || undefined} data-unavailable={(!loading && unavailable) || undefined}>
      {!loading && unavailable && !empty ? <WarningAlert size="s" title={messages.unavailable} className="dashboard-source-notice mb-4" /> : null}
      {showState
        ? <DataState state={unavailable ? "unavailable" : "empty"} size="s" title={unavailable ? messages.unavailable : messages.empty} description={null} className="dashboard-empty-state" />
        : <div className="dashboard-panel-content">{children}</div>}
    </Panel>
  );
}
