"use client";

import { DashboardModule } from "@mairie360/lib-components";
import { useEffect, useState } from "react";
import { requestBff } from "@/lib/bff-client";
import { type DashboardBootstrap, quickActionTarget, REPORTS_UNAVAILABLE, toDashboardModuleData } from "@/lib/dashboard-view";

const urls = {
  project: process.env.NEXT_PUBLIC_PROJECT_FRONT_URL ?? "https://project.dev.mairie360-eip.fr/",
  calendar: process.env.NEXT_PUBLIC_CALENDAR_FRONT_URL ?? "https://calendar.dev.mairie360-eip.fr/",
  files: process.env.NEXT_PUBLIC_FILES_FRONT_URL ?? "https://files.dev.mairie360-eip.fr/",
  message: process.env.NEXT_PUBLIC_MESSAGE_FRONT_URL ?? "https://message.dev.mairie360-eip.fr/",
};
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
            window.location.href = target;
          }}
          onViewAllProjects={() => { window.location.href = urls.project; }} onViewAllTasks={() => { window.location.href = urls.project; }}
          onProjectSelect={() => { window.location.href = urls.project; }} onTaskSelect={() => { window.location.href = urls.project; }}
          onOpenCalendar={() => { window.location.href = urls.calendar; }} onEventSelect={() => { window.location.href = urls.calendar; }} />
      </>}
    </main>
  );
}
