import { useId, type ReactNode } from "react";
import { Calendar, FileCheck2, FolderOpen, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = { projects: FolderOpen, tasks: FileCheck2, events: Calendar };

export default function DashboardPanel({ title, action, href, kind, empty, unavailable, children, className = "" }: {
  title: string; action: string; href?: string; kind: "projects" | "tasks" | "events";
  empty: boolean; unavailable: boolean; children: ReactNode; className?: string;
}) {
  const headingId = useId();
  const Icon = icons[kind];
  const emptyMessage = kind === "projects" ? "Aucun projet récent." : kind === "tasks" ? "Aucune tâche en attente." : "Aucun événement à venir.";
  const unavailableMessage = kind === "projects" ? "Les projets sont temporairement indisponibles." : kind === "tasks" ? "Les tâches sont temporairement indisponibles." : "Les événements sont temporairement indisponibles.";
  return <section aria-labelledby={headingId} className={`dashboard-panel ${className}`}>
    <header><h2 id={headingId}>{title}</h2>{href ? <a className="dashboard-panel-action" href={href}>{action}</a> : <button className="dashboard-panel-action" type="button" disabled title="Destination temporairement indisponible">{action}</button>}</header>
    {unavailable && !empty ? <p className="dashboard-source-notice">{unavailableMessage}</p> : null}
    {!empty ? <div className="dashboard-panel-content">{children}</div> : null}
    {empty ? <div className="dashboard-empty-state"><Icon aria-hidden="true" strokeWidth={1.5} size={72} /><p>{unavailable ? unavailableMessage : emptyMessage}</p></div> : null}
  </section>;
}
