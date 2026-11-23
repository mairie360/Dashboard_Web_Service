"use client";
import { PageHeader } from "@mairie360/lib-components/primitives";
import { getInstanceTimeZone } from "@mairie360/lib-components/shared";

/** Subtitle of the welcome header (MAIR-924). */
export const DASHBOARD_WELCOME_SUBTITLE = "Bienvenue sur votre espace Mairie360.";

/** Hour of `date` on the instance clock (0-23); an unknown zone falls back to the machine's. */
export function instanceHour(date: Date, timeZone = getInstanceTimeZone()): number {
  try {
    const hour = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", hourCycle: "h23", timeZone }).format(date);
    return Number.parseInt(hour, 10);
  } catch {
    return date.getHours();
  }
}

/** « Bonjour », or « Bonsoir » from 18:00 on the instance clock (MAIR-924). */
export const salutation = (date: Date = new Date(), timeZone?: string) => instanceHour(date, timeZone) >= 18 ? "Bonsoir" : "Bonjour";

/** « Bonjour Alice »; without a first name, the salutation alone. */
export const dashboardGreeting = (userFirstName?: string, date?: Date, timeZone?: string) => {
  const name = userFirstName?.trim();
  const word = salutation(date, timeZone);
  return name ? `${word} ${name}` : word;
};

/**
 * Welcome header of the dashboard (Figma F1, MAIR-924): h1 « Bonjour <prénom> » and its
 * subtitle, no page title nor date, on the lib PageHeader « Accueil » variant (MAIR-1113).
 */
export const DashboardHeader = ({ userFirstName, now }: { userFirstName?: string; now?: Date }) => (
  <PageHeader variant="welcome" title={dashboardGreeting(userFirstName, now)} subtitle={DASHBOARD_WELCOME_SUBTITLE} className="page-title-row dashboard-welcome" />
);
