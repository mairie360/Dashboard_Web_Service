"use client";

import {
  DashboardPendingTasks,
  DashboardRecentProjects,
  DashboardUpcomingEvents,
} from "@mairie360/lib-components";
import { useEffect, useState } from "react";
import { requestBff } from "@/lib/bff-client";
import { frontUrl } from "@/lib/front-urls";
import { type DashboardBootstrap, toDashboardModuleData } from "@/lib/dashboard-view";

// Resolved on use from the runtime environment (src/lib/front-urls.ts), never inlined at build time.
const urls = {
  get project() { return frontUrl("PROJECT_FRONT_URL"); },
  get calendar() { return frontUrl("CALENDAR_FRONT_URL"); },
};
const goTo = (href: string | undefined) => { if (href) window.location.href = href; };
export default function Home() {
  const [data, setData] = useState<DashboardBootstrap | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void requestBff<DashboardBootstrap>("/dashboard/bootstrap", { signal: controller.signal }).then(setData).catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, []);
  const view = data && toDashboardModuleData(data);
  return (
    <main className="min-h-screen bg-[#f5f3f0] text-[#172033] px-4 py-6 sm:px-6 lg:px-8">
      {error && <p role="alert" className="mb-4 rounded bg-white p-4 text-red-700">{error}</p>}
      {!data || !view ? <p role="status">{error ? "Le tableau de bord est indisponible." : "Chargement du tableau de bord…"}</p> : <>
        {view.hasUnavailableSource && <p role="status" className="mb-4 rounded bg-white p-4">Certaines données sont temporairement indisponibles.</p>}
        <section className="mx-auto max-w-[1520px] space-y-6">
          <header>
            <h1 className="text-[28px] font-bold leading-tight">Tableau de Bord</h1>
            <p className="mt-1 text-base text-[#687385]">Bienvenue {data.userFirstName}, voici un aperçu de vos activités</p>
          </header>
          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardRecentProjects projects={view.projects}
              onViewAll={() => goTo(urls.project)} onSelect={() => goTo(urls.project)} />
            <DashboardPendingTasks tasks={view.tasks}
              onViewAll={() => goTo(urls.project)} onSelect={() => goTo(urls.project)} />
            <DashboardUpcomingEvents className="xl:col-span-2" events={view.events}
              onOpenCalendar={() => goTo(urls.calendar)} onSelect={() => goTo(urls.calendar)} />
          </div>
        </section>
      </>}
    </main>
  );
}
