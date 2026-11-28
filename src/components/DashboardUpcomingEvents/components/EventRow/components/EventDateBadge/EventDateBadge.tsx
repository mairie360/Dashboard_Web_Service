import { Text } from "@mairie360/lib-components/primitives";

import { eventDateParts } from './event-date';

/** Date badge of an event row (Figma Dashboard/EventDateBadge, MAIR-907): bold day, lowercase abbreviated month (« 4 », « déc. »), calendar-coloured top edge. */
export const EventDateBadge = ({ startsAt, locale }: { startsAt: string; locale?: string }) => {
  const date = eventDateParts(startsAt, locale);
  return (
    <span className="dashboard-event-date">
      <Text as="span" size="l" weight="bold">{date.day}</Text>
      <Text as="span" size="xs" tone="muted" className="dashboard-event-month">{date.month}</Text>
    </span>
  );
};
