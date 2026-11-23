"use client";
import { useState } from "react";
import { ToastProvider } from "@mairie360/lib-components/primitives";
import { AccessibleShell, defaultSidebarItems } from "@mairie360/lib-components/shell";

import type { DashboardBootstrap } from '../../lib/dashboard-view';
import { getActiveFrontHrefs } from '../../lib/navigation';
import { logoutAndRedirect } from '../../lib/logout';
import { DashboardGrid } from './components/DashboardGrid';
import { DashboardHeader } from '../DashboardHeader';
import { DashboardLoading } from './components/DashboardLoading';
import { DashboardNotices } from './components/DashboardNotices';
import { useDashboardData } from './use-dashboard-data';

/**
 * Entries of the navigation (MAIR-1106): the lib defaults, « Formation » labelled « E-learning ».
 * Administration stays admin-only (filtered by the shell from the trusted role); there is no Workflows entry.
 */
export const dashboardSidebarItems = defaultSidebarItems.map((item) => item.id === "training" ? { ...item, label: "E-learning" } : item);

/** The dashboard page: shell, notices, header and the panel grid, fed by `useDashboardData`. */
export default function DashboardPage({ initialData }: { initialData?: DashboardBootstrap | null }) {
  const { data, view, error, loading, reload } = useDashboardData(initialData);
  const [logoutError, setLogoutError] = useState("");
  const userFirstName = data?.userFirstName.trim() ?? "";
  return (
    <AccessibleShell
      className="dashboard-app-shell"
      activeItem="dashboard"
      hrefs={getActiveFrontHrefs()}
      user={userFirstName ? { first_name: userFirstName } : undefined}
      sidebarProps={{ items: dashboardSidebarItems }}
      // MAIR-919: the lib Header confirms first; the returned promise keeps « Se déconnecter » loading.
      onLogout={() => logoutAndRedirect().catch(() => setLogoutError("La déconnexion est temporairement indisponible."))}
    >
      <ToastProvider regionLabel="Notifications du tableau de bord" placement="bottom-end">
        <DashboardNotices error={error} logoutError={logoutError} loading={loading} hasUnavailableSource={Boolean(view?.hasUnavailableSource)} unusableEventCount={view?.unusableEventCount ?? 0} hasData={Boolean(data)} onReload={reload} />
        <section className="dashboard-page mx-auto max-w-[1520px]">
          {/* MAIR-899: the final page is drawn at once; only the rows wait for the data. */}
          <DashboardHeader userFirstName={userFirstName} />
          {!data || !view ? <DashboardLoading loading={loading} failed={Boolean(error)} /> : null}
          {data || loading ? <DashboardGrid data={data} view={view} /> : null}
        </section>
      </ToastProvider>
    </AccessibleShell>
  );
}
