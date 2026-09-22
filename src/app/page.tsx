"use client";

import { DashboardModule } from "@mairie360/lib-components";
import { useEffect, useState } from "react";
import { requestBff } from "@/lib/bff-client";
import { frontUrl } from "@/lib/front-urls";
import { type DashboardBootstrap, type FrontUrls, quickActionTarget, REPORTS_UNAVAILABLE, toDashboardModuleData } from "@/lib/dashboard-view";

// Resolved on use from the runtime environment (src/lib/front-urls.ts), never inlined at build time.
const urls: FrontUrls = {
  get project() { return frontUrl("PROJECT_FRONT_URL"); },
  get calendar() { return frontUrl("CALENDAR_FRONT_URL"); },
  get files() { return frontUrl("FILES_FRONT_URL"); },
  get message() { return frontUrl("MESSAGE_FRONT_URL"); },
};
const goTo = (href: string | undefined) => { if (href) window.location.href = href; };
export default function Home() {
  const [data, setData] = useState<DashboardBootstrap | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void requestBff<DashboardBootstrap>("/dashboard/bootstrap", { signal: controller.signal }).then(setData).catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, []);
  const view = data && toDashboardModuleData(data);
  return (
    <main className="min-h-screen bg-[#f5f3f0] text-[#172033] px-4 py-6 sm:px-6 lg:px-8">
      {notice && <p role="status" className="mb-4 rounded bg-white p-4">{notice}</p>}
      {error && <p role="alert" className="mb-4 rounded bg-white p-4 text-red-700">{error}</p>}
      {!data || !view ? <p role="status">{error ? "Le tableau de bord est indisponible." : "Chargement du tableau de bord…"}</p> : <>
        {view.hasUnavailableSource && <p role="status" className="mb-4 rounded bg-white p-4">Certaines données sont temporairement indisponibles.</p>}
        <p className="mx-auto mb-4 max-w-[1520px]">Projets accessibles : {view.totalProjectsLabel}. Les tâches ci-dessous concernent les projets affichés.</p>
        <DashboardModule className="mx-auto max-w-[1520px]" userFirstName={data.userFirstName} metrics={[]} performance={[]} showPerformance={false}
          projects={view.projects} tasks={view.tasks} events={view.events}
          onQuickAction={(action) => {
            const target = quickActionTarget(action, urls);
            if (target === null) { setNotice(REPORTS_UNAVAILABLE); return; }
            goTo(target);
          }}
          onViewAllProjects={() => { goTo(urls.project); }} onViewAllTasks={() => { goTo(urls.project); }}
          onProjectSelect={() => { goTo(urls.project); }} onTaskSelect={() => { goTo(urls.project); }}
          onOpenCalendar={() => { goTo(urls.calendar); }} onEventSelect={() => { goTo(urls.calendar); }} />
      </>}
    </main>
  );
}
