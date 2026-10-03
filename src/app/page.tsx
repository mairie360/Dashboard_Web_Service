"use client";

import {
  AppShell,
  DashboardPendingTasks,
  DashboardRecentProjects,
  DashboardUpcomingEvents,
} from "@mairie360/lib-components";
import { useCallback, useEffect, useRef, useState } from "react";
import { requestBff } from "@/lib/bff-client";
import { frontUrl } from "@/lib/front-urls";
import { getActiveFrontHrefs } from "@/lib/navigation";
import { logoutAndRedirect } from "@/lib/logout";
import { type DashboardBootstrap, toDashboardModuleData } from "@/lib/dashboard-view";

// Resolved on use from the runtime environment (src/lib/front-urls.ts), never inlined at build time.
const urls = {
  get project() { return frontUrl("PROJECT_FRONT_URL"); },
  get calendar() { return frontUrl("CALENDAR_FRONT_URL"); },
};
const goTo = (href: string | undefined) => { if (href) window.location.href = href; };
const goToProject = (projectId: string, taskId?: string) => {
  const projectUrl = urls.project;
  if (!projectUrl || !projectId) return;

  const destination = new URL(projectUrl);
  destination.searchParams.set("project", projectId);
  if (taskId) destination.searchParams.set("task", taskId);
  goTo(destination.toString());
};
const goToCalendarEvent = (event: { id: string; startsAt: string }) => {
  const calendarUrl = urls.calendar;
  if (!calendarUrl) return;

  const destination = new URL(calendarUrl);
  destination.searchParams.set("date", event.startsAt.slice(0, 10));
  destination.searchParams.set("event", event.id);
  goTo(destination.toString());
};
export default function Home() {
  const [data, setData] = useState<DashboardBootstrap | null>(null);
  const [error, setError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [loading, setLoading] = useState(true);
  const readController = useRef<AbortController | null>(null);
  const loadDashboard = useCallback(async () => {
    // The ref guards consecutive clicks before React renders the disabled button.
    if (readController.current) return;
    const controller = new AbortController();
    readController.current = controller;
    try {
      const response = await requestBff<DashboardBootstrap>("/dashboard/bootstrap", { signal: controller.signal });
      if (controller.signal.aborted || readController.current !== controller) return;
      setData(response);
      setError("");
    } catch (reason) {
      if (!controller.signal.aborted && readController.current === controller) {
        // Retain the last confirmed cards; a failed read is not an empty result.
        setError(reason instanceof Error ? reason.message : "Le tableau de bord est temporairement indisponible.");
      }
    } finally {
      if (readController.current === controller) {
        readController.current = null;
        setLoading(false);
      }
    }
  }, []);
  useEffect(() => {
    void loadDashboard();
    return () => {
      readController.current?.abort();
      readController.current = null;
    };
  }, [loadDashboard]);
  const view = data && toDashboardModuleData(data);
  const userFirstName = data?.userFirstName.trim() ?? "";
  return (
    <AppShell
      activeItem="dashboard"
      hrefs={getActiveFrontHrefs()}
      user={userFirstName ? { first_name: userFirstName } : undefined}
      onLogout={() => void logoutAndRedirect().catch(() => setLogoutError("La déconnexion est temporairement indisponible."))}
      sidebarProps={{ brandLogoSrc: "/mairie360-logo.png" }}
    >
      {logoutError && <p role="alert" className="mb-4 rounded bg-white p-4 text-red-700">{logoutError}</p>}
      {error && <p role="alert" className="mb-4 rounded bg-white p-4 text-red-700">{error}</p>}
      {(error || view?.hasUnavailableSource) && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button type="button" disabled={loading} aria-busy={loading}
            className="rounded-md border border-[#d8d2ca] bg-[#fbfaf9] px-4 py-2 font-semibold text-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155bb5]/30 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => { setLoading(true); void loadDashboard(); }}>
            {error ? "Réessayer le chargement" : "Actualiser les données indisponibles"}
          </button>
          {loading && <p role="status">Actualisation du tableau de bord…</p>}
          {data && error && <p className="text-sm text-[#687385]">Les dernières données reçues restent affichées.</p>}
        </div>
      )}
      {!data || !view ? <p role="status">{error && !loading ? "Le tableau de bord est indisponible." : "Chargement du tableau de bord…"}</p> : <>
        {view.hasUnavailableSource && <p role="status" className="mb-4 rounded bg-white p-4">Certaines données sont temporairement indisponibles.</p>}
        <section className="mx-auto max-w-[1520px] space-y-4">
          <header>
            <h1 className="text-[28px] font-bold leading-tight">Tableau de Bord</h1>
            <p className="mt-1 text-base text-[#687385]">
              {userFirstName
                ? `Bienvenue ${userFirstName}, voici un aperçu de vos activités`
                : "Voici un aperçu de vos activités"}
            </p>
          </header>
          <div className="dashboard-content-grid grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DashboardRecentProjects className="dashboard-recent-projects" projects={view.projects}
              onViewAll={() => goTo(urls.project)} onSelect={(project) => goToProject(project.id)} />
            <DashboardPendingTasks className="dashboard-pending-tasks" tasks={view.tasks}
              onViewAll={() => goTo(urls.project)} onSelect={(selected) => {
                const task = data.tasks.find((candidate: { projectId: string; id: string }) =>
                  `${candidate.projectId}:${candidate.id}` === selected.id);
                if (task) goToProject(task.projectId, task.id);
              }} />
            <DashboardUpcomingEvents className="dashboard-upcoming-events-grid xl:col-span-2" events={view.events}
              onOpenCalendar={() => goTo(urls.calendar)} onSelect={goToCalendarEvent} />
          </div>
        </section>
      </>}
    </AppShell>
  );
}
