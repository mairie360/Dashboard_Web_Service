"use client";

/**
 * Announcement of the page before any confirmed data (Figma F1, MAIR-899): the tiles themselves show
 * skeleton rows, so the status line is only read by screen readers while loading.
 */
export const DashboardLoading = ({ loading, failed }: { loading: boolean; failed: boolean }) => (
  failed && !loading
    ? <p role="status">Le tableau de bord est indisponible.</p>
    : <p role="status" className="sr-only">Chargement du tableau de bord…</p>
);
