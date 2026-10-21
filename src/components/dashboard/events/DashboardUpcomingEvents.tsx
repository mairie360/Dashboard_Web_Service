"use client";
import React from "react";
import { Panel } from "@mairie360/lib-components/primitives";

import type { DashboardEvent } from "../types";
import { PanelViewAll } from "../panels/PanelViewAll";
import { byStart } from "./event-date";
import { EventRow } from "./EventRow";

export interface DashboardUpcomingEventsProps extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  events?: DashboardEvent[];
  locale?: string;
  onSelect?: (event: DashboardEvent) => void;
  onOpenCalendar?: () => void;
  bare?: boolean;
}

/** Upcoming events in chronological order; each row delegates its selection. */
export const DashboardUpcomingEvents = ({ events = [], locale = "fr-FR", onSelect, onOpenCalendar, bare = false, className = "", ...props }: DashboardUpcomingEventsProps) => {
  const sorted = byStart(events);
  const rows = <div className="dashboard-rows dashboard-events-rows">{sorted.map((event) => <EventRow key={event.id} event={event} locale={locale} onSelect={onSelect} />)}</div>;
  if (bare) return <div {...props} className={`dashboard-upcoming-events ${className}`.trim()}>{rows}</div>;
  return (
    <Panel {...props} title="Événements à venir" action={onOpenCalendar ? <PanelViewAll onClick={onOpenCalendar} /> : undefined} state={sorted.length === 0 ? "empty" : "default"} stateProps={{ title: "Aucun événement à venir.", description: null }} className={`dashboard-upcoming-events ${className}`.trim()}>
      {rows}
    </Panel>
  );
};
