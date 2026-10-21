"use client";
import { Caption } from "@mairie360/lib-components/primitives";

import type { DashboardBootstrap } from '@/lib/dashboard-view';
import type { toDashboardModuleData } from '@/lib/dashboard-view';
import DashboardPanel from './components/DashboardPanel';
import { DashboardRecentProjects } from '@/components/DashboardRecentProjects';
import { DashboardPendingTasks } from '@/components/DashboardPendingTasks';
import { DashboardUpcomingEvents } from '@/components/DashboardUpcomingEvents';
import { calendarEventHref, dashboardUrls, navigateTo, projectHref } from './dashboard-links';

export interface DashboardGridProps {
  data: DashboardBootstrap;
  view: ReturnType<typeof toDashboardModuleData>;
}

/** The three panels of the dashboard wired to their module destinations. */
export const DashboardGrid = ({ data, view }: DashboardGridProps) => (
  <div className="dashboard-content-grid grid grid-cols-1 gap-6 xl:grid-cols-2">
    <DashboardPanel title="Projets récents" kind="projects" action="Voir les projets" href={dashboardUrls.project} empty={view.projects.length === 0} unavailable={data.sources.projects === "unavailable"}>
      <DashboardRecentProjects bare projects={view.projects} onViewAll={() => navigateTo(dashboardUrls.project)} onSelect={(project) => navigateTo(projectHref(project.id))} />
    </DashboardPanel>
    <DashboardPanel title="Tâches en attente" kind="tasks" action="Voir les tâches" href={dashboardUrls.project} empty={view.tasks.length === 0} unavailable={data.sources.tasks === "unavailable"}>
      <DashboardPendingTasks bare tasks={view.tasks} onViewAll={() => navigateTo(dashboardUrls.project)} onSelect={(selected) => {
        const task = data.tasks.find((candidate: { projectId: string; id: string }) => `${candidate.projectId}:${candidate.id}` === selected.id);
        if (task) navigateTo(projectHref(task.projectId, task.id));
      }} />
    </DashboardPanel>
    <DashboardPanel title="Événements à venir" kind="events" action="Ouvrir le calendrier" href={dashboardUrls.calendar} empty={view.events.length === 0 && view.unusableEventCount === 0} unavailable={data.sources.calendar === "unavailable"} className="dashboard-events-panel xl:col-span-2">
      {view.unusableEventCount > 0 && view.events.length === 0
        ? <Caption as="p" role="status" className="block py-8 text-center">Les événements reçus ne peuvent pas être affichés : leurs dates ou heures sont illisibles.</Caption>
        : <DashboardUpcomingEvents bare className="dashboard-upcoming-events-grid" events={view.events} onOpenCalendar={() => navigateTo(dashboardUrls.calendar)} onSelect={(event) => navigateTo(calendarEventHref(event))} />}
    </DashboardPanel>
  </div>
);
