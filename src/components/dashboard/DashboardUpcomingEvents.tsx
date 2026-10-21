import React from 'react';

import { dashboardCardActionClasses, joinDashboardClasses } from './styles';
import type { DashboardEvent } from './types';

export interface DashboardUpcomingEventsProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
  events?: DashboardEvent[];
  locale?: string;
  onSelect?: (event: DashboardEvent) => void;
  onOpenCalendar?: () => void;
}

const getDateParts = (startsAt: string, locale: string) => {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return { day: '--', month: '---', time: '--:--' };
  return {
    day: new Intl.DateTimeFormat(locale, { day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat(locale, { month: 'short' }).format(date).replace('.', ''),
    time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(date),
  };
};

export const DashboardUpcomingEvents = ({
  events = [],
  locale = 'fr-FR',
  onSelect,
  onOpenCalendar,
  className = '',
  ...props
}: DashboardUpcomingEventsProps) => {
  const sortedEvents = [...events].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());

  return (
    <section className={joinDashboardClasses('rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-6', className)} {...props}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-[var(--mairie-text)]">Événements à venir</h2>
        {onOpenCalendar && <button type="button" className={dashboardCardActionClasses} onClick={onOpenCalendar}>Voir tout</button>}
      </div>
      <div className="mt-6 space-y-3">
        {sortedEvents.map((event) => {
          const date = getDateParts(event.startsAt, locale);
          return (
            <button key={event.id} type="button" disabled={!onSelect} className="flex w-full items-center gap-3 rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface-raised)] p-3 text-left transition hover:bg-[var(--mairie-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mairie-accent)]/30 disabled:cursor-default" onClick={() => onSelect?.(event)}>
              <span className="flex min-w-16 shrink-0 flex-col items-center rounded-lg bg-[var(--mairie-action-background)] px-2 py-2 text-[var(--mairie-on-action)]">
                <span className="text-xs font-semibold uppercase">{date.day} {date.month}</span>
                <span className="text-sm font-bold">{date.time}</span>
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-[var(--mairie-text)]">{event.title}</span>
                <span className="block truncate text-sm text-[var(--mairie-muted)]">{event.location}</span>
              </span>
            </button>
          );
        })}
        {sortedEvents.length === 0 && <p className="py-8 text-center text-sm text-[var(--mairie-muted)]">Aucun événement à venir.</p>}
      </div>
    </section>
  );
};
