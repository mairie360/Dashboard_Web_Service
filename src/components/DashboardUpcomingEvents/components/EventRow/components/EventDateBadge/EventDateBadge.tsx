import { Text } from "@mairie360/lib-components/primitives";

import { eventDateParts } from './event-date';

/** The day/month/time block at the start of an event row. */
export const EventDateBadge = ({ startsAt, locale }: { startsAt: string; locale?: string }) => {
  const date = eventDateParts(startsAt, locale);
  return (
    <span className="dashboard-event-date flex min-w-16 shrink-0 flex-col items-center rounded-lg bg-[var(--mairie-action-background)] px-2 py-2 text-[var(--mairie-on-action)]">
      <Text as="span" size="xs" weight="semibold" uppercase tone="inverse" style={{ color: "inherit" }}>{date.day} {date.month}</Text>
      <Text as="span" size="s" weight="bold" style={{ color: "inherit" }}>{date.time}</Text>
    </span>
  );
};
