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
import { DashboardOnboarding } from './components/DashboardOnboarding';
import { useDashboardData } from './use-dashboard-data';

/** The Messagerie badge (MAIR-1106): the unread count, « 99+ » beyond, nothing at 0 or when Message API is unavailable. */
export function unreadBadge(unreadMessages: number | null | undefined): string | undefined {
  if (typeof unreadMessages !== "number" || !Number.isInteger(unreadMessages) || unreadMessages <= 0) return undefined;
  return unreadMessages > 99 ? "99+" : String(unreadMessages);
}

/** The unread count to show, only while Message API is available (MAIR-1106): never a stale or inconsistent number. */
export function dashboardUnreadCount(data: DashboardBootstrap | null | undefined): number | null {
  return data?.sources?.messages === "available" ? data.unreadMessages ?? null : null;
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

/**
 * The dashboard page: shell, notices, header and the panel grid, fed by `useDashboardData`.
 * `renderedAt` is the server render instant: the greeting is computed from it on both sides, so the
 * browser hydrates the same « Bonjour » / « Bonsoir » as the server even when its clock differs.
 */
export default function DashboardPage({ initialData, renderedAt }: { initialData?: DashboardBootstrap | null; renderedAt?: string }) {
  const { data, view, error, loading, reload } = useDashboardData(initialData);
  const [logoutError, setLogoutError] = useState("");
  const userFirstName = data?.userFirstName.trim() ?? "";
  const communeName = data?.communeName?.trim() || undefined;
  const renderTime = renderedAt ? new Date(renderedAt) : undefined;
  const now = renderTime && Number.isFinite(renderTime.getTime()) ? renderTime : undefined;
  return (
    <AccessibleShell
      className="dashboard-app-shell"
      activeItem="dashboard"
      hrefs={getActiveFrontHrefs()}
      // MAIR-889: « Prénom Nom · Rôle » in the user menu; no empty role label.
      user={dashboardUser(data)}
      // The shared header and navigation name the commune of the instance; without one, neither shows a commune.
      commune={communeName}
      sidebarProps={{ items: dashboardSidebarItems(dashboardUnreadCount(data)) }}
      // MAIR-919: the lib Header confirms first; the returned promise keeps « Se déconnecter » loading.
      onLogout={() => logoutAndRedirect().catch(() => setLogoutError("La déconnexion est temporairement indisponible."))}
    >
      <ToastProvider regionLabel="Notifications du tableau de bord" placement="bottom-end">
        <DashboardNotices error={error} logoutError={logoutError} loading={loading} hasUnavailableSource={Boolean(view?.hasUnavailableSource)} unusableEventCount={view?.unusableEventCount ?? 0} hasData={Boolean(data)} onReload={reload} />
        <section className="dashboard-page mx-auto max-w-[1520px]">
          {/* MAIR-899: the final page is drawn at once; only the rows wait for the data. */}
          <DashboardHeader userFirstName={userFirstName} now={now} />
          {!data || !view ? <DashboardLoading loading={loading} failed={Boolean(error)} /> : null}
          {data || loading ? <DashboardGrid data={data} view={view} /> : null}
        </section>
        {/* The welcome tour, until the user finished or skipped it. */}
        <DashboardOnboarding onboardingCompleted={data?.onboardingCompleted} />
      </ToastProvider>
    </AccessibleShell>
  );
}
