"use client";
import { BodySmall, Text } from "@mairie360/lib-components/primitives";

import type { DashboardEvent } from '@/components/dashboard-types';
import { EventDateBadge } from './components/EventDateBadge';

export interface EventRowProps {
  event: DashboardEvent;
  locale?: string;
  onSelect?: (event: DashboardEvent) => void;
}

/** One upcoming event: date badge, title and location (Figma DashboardUpcomingEvents row). */
export const EventRow = ({ event, locale, onSelect }: EventRowProps) => (
  <button type="button" disabled={!onSelect} className="dashboard-event-row flex w-full items-center gap-3 rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface-raised)] p-3 text-left transition hover:bg-[var(--mairie-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mairie-accent)] disabled:cursor-default" onClick={() => onSelect?.(event)}>
    <EventDateBadge startsAt={event.startsAt} locale={locale} />
    <span className="min-w-0">
      <Text weight="semibold" truncate>{event.title}</Text>
      <BodySmall as="span" tone="muted" truncate>{event.location}</BodySmall>
    </span>
  </button>
);
