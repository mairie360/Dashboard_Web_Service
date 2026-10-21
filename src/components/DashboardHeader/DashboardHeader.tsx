"use client";
import { PageHeader } from "@mairie360/lib-components/primitives";

/** Greeting of the dashboard: name of the agent when known. */
export const dashboardGreeting = (userFirstName?: string) =>
  userFirstName?.trim() ? `Bienvenue ${userFirstName.trim()}, voici un aperçu de vos activités` : "Voici un aperçu de vos activités";

/** The page title row (Figma Base/PageHeader WithDate): h1, greeting and today's date. */
export const DashboardHeader = ({ userFirstName, showDate = true }: { userFirstName?: string; showDate?: boolean }) => (
  <PageHeader title="Tableau de Bord" subtitle={dashboardGreeting(userFirstName)} showDate={showDate} className="page-title-row" />
);
