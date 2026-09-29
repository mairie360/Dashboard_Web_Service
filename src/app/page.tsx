"use client";

import {
  AppShell,
  DashboardPendingTasks,
  DashboardRecentProjects,
  DashboardUpcomingEvents,
} from "@mairie360/lib-components";
import { useEffect, useState } from "react";
import { requestBff } from "@/lib/bff-client";
import { frontUrl } from "@/lib/front-urls";
import { getActiveFrontHrefs } from "@/lib/navigation";
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
  useEffect(() => {
    const controller = new AbortController();
    void requestBff<DashboardBootstrap>("/dashboard/bootstrap", { signal: controller.signal }).then(setData).catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, []);
  const view = data && toDashboardModuleData(data);
  const userFirstName = data?.userFirstName.trim() ?? "";
  return (
    <AppShell
      activeItem="dashboard"
      hrefs={getActiveFrontHrefs()}
      user={userFirstName ? { first_name: userFirstName } : undefined}
      sidebarProps={{ brandLogoSrc: "/mairie360-logo.png" }}
    >
      {error && <p role="alert" className="mb-4 rounded bg-white p-4 text-red-700">{error}</p>}
      {!data || !view ? <p role="status">{error ? "Le tableau de bord est indisponible." : "Chargement du tableau de bord…"}</p> : <>
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
          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardRecentProjects projects={view.projects}
              onViewAll={() => goTo(urls.project)} onSelect={(project) => goToProject(project.id)} />
            <DashboardPendingTasks tasks={view.tasks}
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
