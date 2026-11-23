"use client";
import { DataState, Panel } from "@mairie360/lib-components/primitives";

/**
 * The page before any confirmed data. While loading (Figma F1, MAIR-899) the tiles show skeleton rows,
 * so the status line is only read by screen readers. When the first read failed (MAIR-915, F3), a
 * `Panel` holds the error `DataState`, with no technical message.
 */
export const DashboardLoading = ({ loading, failed }: { loading: boolean; failed: boolean }) => (
  failed && !loading
    ? (
      <Panel title="Mes activités" className="dashboard-failure">
        <DataState state="error" size="m" title="Le tableau de bord est indisponible." description="Vos projets, tâches et événements s'afficheront dès que le service répondra." />
      </Panel>
    )
    : <p role="status" className="sr-only">Chargement du tableau de bord…</p>
);
