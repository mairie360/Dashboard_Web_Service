export interface EventDateParts { day: string; month: string; time: string }

/** Day (« 4 »), lowercase abbreviated month (« déc. ») and 24 h time of an event start, or placeholders for an unreadable value. */
export function eventDateParts(startsAt: string, locale = "fr-FR"): EventDateParts {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return { day: "--", month: "---", time: "--:--" };
  return {
    day: new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date),
    month: new Intl.DateTimeFormat(locale, { month: "short" }).format(date).toLocaleLowerCase(locale),
    time: new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(date),
  };
}
