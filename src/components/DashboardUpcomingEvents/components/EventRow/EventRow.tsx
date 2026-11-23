"use client";
import { Clock } from "lucide-react";
import { BodySmall, Icon, Text } from "@mairie360/lib-components/primitives";

import type { DashboardEvent } from '@/components/dashboard-types';
import { EventDateBadge, eventDateParts } from './components/EventDateBadge';

export interface EventRowProps {
  event: DashboardEvent;
  locale?: string;
  onSelect?: (event: DashboardEvent) => void;
}

/** One upcoming event as a compact row (Figma Dashboard/EventRow, MAIR-907): date badge, title, « heure · lieu ». */
export const EventRow = ({ event, locale, onSelect }: EventRowProps) => {
  const { time } = eventDateParts(event.startsAt, locale);
  const where = [time, event.location.trim()].filter(Boolean).join(" · ");
  return (
    <button type="button" disabled={!onSelect} className="dashboard-row dashboard-event-row" onClick={() => onSelect?.(event)}>
      <EventDateBadge startsAt={event.startsAt} locale={locale} />
      <span className="min-w-0 flex-1">
        <Text weight="semibold" truncate>{event.title}</Text>
        <BodySmall as="span" tone="muted" className="dashboard-row-meta"><Icon icon={Clock} size="xs" />{where}</BodySmall>
      </span>
    </button>
  );
};
