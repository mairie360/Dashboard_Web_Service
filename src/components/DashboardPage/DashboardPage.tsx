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

/** The Messagerie badge (MAIR-1106): the unread count, « 99+ » beyond, nothing at 0 or when Message API is unavailable. */
export function unreadBadge(unreadMessages: number | null | undefined): string | undefined {
  if (typeof unreadMessages !== "number" || !Number.isInteger(unreadMessages) || unreadMessages <= 0) return undefined;
  return unreadMessages > 99 ? "99+" : String(unreadMessages);
}

/**
 * Entries of the navigation (MAIR-1106): the lib defaults, « Formation » labelled « E-learning », and the unread
 * count on « Messagerie ». Administration stays admin-only (filtered by the shell from the trusted role); there is
 * no Workflows entry.
 */
export function dashboardSidebarItems(unreadMessages?: number | null) {
  const badge = unreadBadge(unreadMessages);
  return defaultSidebarItems.map((item) => {
    if (item.id === "training") return { ...item, label: "E-learning" };
    if (item.id === "messages" && badge) return { ...item, badge };
    return item;
  });
}

/** The account shown in the Header: first and last name, and the role when the bootstrap gives one. */
export function dashboardUser(data: DashboardBootstrap | null) {
  const first = data?.userFirstName.trim() ?? "";
  if (!first) return undefined;
  const last = data?.userLastName?.trim() ?? "";
  const role = data?.userRole?.trim() ?? "";
  return { first_name: first, ...(last ? { last_name: last, name: `${first} ${last}` } : {}), ...(role ? { role } : {}) };
}

/** The dashboard page: shell, notices, header and the panel grid, fed by `useDashboardData`. */
export default function DashboardPage({ initialData }: { initialData?: DashboardBootstrap | null }) {
  const { data, view, error, loading, reload } = useDashboardData(initialData);
  const [logoutError, setLogoutError] = useState("");
  const userFirstName = data?.userFirstName.trim() ?? "";
  const communeName = data?.communeName?.trim() || undefined;
  return (
    <AccessibleShell
      className="dashboard-app-shell"
      activeItem="dashboard"
      hrefs={getActiveFrontHrefs()}
      // MAIR-889: « Prénom Nom · Rôle » in the user menu; no empty role label.
      user={dashboardUser(data)}
      // MAIR-883: « Commune de <nom> » in the expanded navigation and the Header's « Mairie de » block, only when
      // the instance names its commune (lib 2.3 otherwise shows a placeholder name).
      sidebarProps={{ items: dashboardSidebarItems(data?.unreadMessages), ...(communeName ? { brandLabel: communeName } : {}) }}
      headerProps={communeName ? { showCommune: true, commune: communeName } : { showCommune: false }}
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
