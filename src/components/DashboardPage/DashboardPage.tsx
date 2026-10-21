"use client";
import { useState } from "react";
import { AccessibleShell } from "@mairie360/lib-components/shell";

import type { DashboardBootstrap } from '../../lib/dashboard-view';
import { getActiveFrontHrefs } from '../../lib/navigation';
import { logoutAndRedirect } from '../../lib/logout';
import { DashboardGrid } from './components/DashboardGrid';
import { DashboardHeader } from '../DashboardHeader';
import { DashboardLoading } from './components/DashboardLoading';
import { DashboardNotices } from './components/DashboardNotices';
import { useDashboardData } from './use-dashboard-data';

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
      onLogout={() => void logoutAndRedirect().catch(() => setLogoutError("La déconnexion est temporairement indisponible."))}
      sidebarProps={{ brandLogoSrc: "/mairie360-logo.png" }}
    >
      <DashboardNotices error={error} logoutError={logoutError} loading={loading} hasUnavailableSource={Boolean(view?.hasUnavailableSource)} unusableEventCount={view?.unusableEventCount ?? 0} hasData={Boolean(data)} onReload={reload} />
      {!data || !view ? <DashboardLoading loading={loading} failed={Boolean(error)} /> : (
        <section className="dashboard-page mx-auto max-w-[1520px] space-y-4">
          <DashboardHeader userFirstName={userFirstName} />
          <DashboardGrid data={data} view={view} />
        </section>
      )}
    </AccessibleShell>
  );
}
