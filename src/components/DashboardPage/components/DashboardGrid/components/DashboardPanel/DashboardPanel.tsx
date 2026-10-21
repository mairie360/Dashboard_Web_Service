"use client";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { DataState, LinkButton, Panel, WarningAlert } from "@mairie360/lib-components/primitives";

export type DashboardPanelKind = "projects" | "tasks" | "events";
export interface DashboardPanelProps {
  title: string;
  /** Label of the destination link (« Voir les projets »). */
  action: string;
  /** Destination; without it the action renders disabled. */
  href?: string;
  kind: DashboardPanelKind;
  empty: boolean;
  unavailable: boolean;
  children: ReactNode;
  className?: string;
}

export const panelMessages: Record<DashboardPanelKind, { empty: string; unavailable: string }> = {
  projects: { empty: "Aucun projet récent.", unavailable: "Les projets sont temporairement indisponibles." },
  tasks: { empty: "Aucune tâche en attente.", unavailable: "Les tâches sont temporairement indisponibles." },
  events: { empty: "Aucun événement à venir.", unavailable: "Les événements sont temporairement indisponibles." },
};

/** Action of a panel: a link to the module, or a disabled button when its URL is not configured. */
export const DashboardPanelAction = ({ label, href }: { label: string; href?: string }) => (
  <LinkButton className="dashboard-panel-action" href={href} icon={ArrowRight} disabled={!href} title={href ? undefined : "Destination temporairement indisponible"}>{label}</LinkButton>
);

/**
 * One dashboard block on the lib `Panel` (Figma Base/Panel): header with title and
 * module link, then the rows, or the empty / unavailable `DataState`.
 */
export default function DashboardPanel({ title, action, href, kind, empty, unavailable, children, className = "" }: DashboardPanelProps) {
  const messages = panelMessages[kind];
  return (
    <Panel title={title} action={<DashboardPanelAction label={action} href={href} />} className={`dashboard-panel ${className}`.trim()} data-kind={kind} data-empty={empty || undefined} data-unavailable={unavailable || undefined}>
      {unavailable && !empty ? <WarningAlert size="s" title={messages.unavailable} className="dashboard-source-notice mb-4" /> : null}
      {empty
        ? <DataState state={unavailable ? "unavailable" : "empty"} size="s" title={unavailable ? messages.unavailable : messages.empty} description={null} className="dashboard-empty-state" />
        : <div className="dashboard-panel-content">{children}</div>}
    </Panel>
  );
}
