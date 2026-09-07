"use client";

import { DashboardModule } from "@mairie360/lib-components";
import { useEffect, useState } from "react";
import type { components } from "@/contracts/bff";
import { requestBff } from "@/lib/bff-client";

type Bootstrap = components["schemas"]["DashboardBootstrap"];
const projectUrl = process.env.NEXT_PUBLIC_PROJECT_FRONT_URL ?? "https://project.dev.mairie360-eip.fr/";
const calendarUrl = process.env.NEXT_PUBLIC_CALENDAR_FRONT_URL ?? "https://calendar.dev.mairie360-eip.fr/";
export default function Home() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void requestBff<Bootstrap>("/dashboard/bootstrap", { signal: controller.signal }).then(setData).catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, []);
  return (
    <main className="min-h-screen bg-[#f5f3f0] text-[#172033] px-4 py-6 sm:px-6 lg:px-8">
      {notice && <p role="status" className="mb-4 rounded bg-white p-4">{notice}</p>}
      {error && <p role="alert" className="mb-4 rounded bg-white p-4 text-red-700">{error}</p>}
      {!data ? <p role="status">{error ? "Le tableau de bord est indisponible." : "Chargement du tableau de bord…"}</p> : <>
        {Object.values(data.sources).includes("unavailable") && <p role="status" className="mb-4 rounded bg-white p-4">Certaines données sont temporairement indisponibles.</p>}
        <p className="mx-auto mb-4 max-w-[1520px]">Projets accessibles : {data.metrics.totalProjects ?? "Indisponible"}. Les tâches ci-dessous concernent les projets affichés.</p>
        <DashboardModule className="mx-auto max-w-[1520px]" userFirstName={data.userFirstName} metrics={[]} performance={[]} showPerformance={false}
          projects={data.projects.map((project) => ({ id: project.id, name: project.title, progress: project.progress, status: project.status === "done" ? "completed" : "in-progress", dueDate: project.dueDate }))}
          tasks={data.tasks.map((task) => ({ id: `${task.projectId}:${task.id}`, title: task.title, dueLabel: task.dueDate || "Sans échéance", priority: task.priority }))}
          events={data.events.map((event) => ({ id: String(event.id), title: event.title, location: event.location ?? "", startsAt: `${event.date}T${event.startTime ?? "00:00"}:00` }))}
          onQuickAction={(action) => {
            if (action === "view-reports") { setNotice("Les rapports ne sont pas encore disponibles."); return; }
            window.location.href = action === "schedule-event" ? calendarUrl
              : action === "new-document" ? process.env.NEXT_PUBLIC_FILES_FRONT_URL ?? "https://files.dev.mairie360-eip.fr/"
              : process.env.NEXT_PUBLIC_MESSAGE_FRONT_URL ?? "https://message.dev.mairie360-eip.fr/";
          }}
          onViewAllProjects={() => { window.location.href = projectUrl; }} onViewAllTasks={() => { window.location.href = projectUrl; }}
          onProjectSelect={() => { window.location.href = projectUrl; }} onTaskSelect={() => { window.location.href = projectUrl; }}
          onOpenCalendar={() => { window.location.href = calendarUrl; }} onEventSelect={() => { window.location.href = calendarUrl; }} />
      </>}
    </main>
  );
}
