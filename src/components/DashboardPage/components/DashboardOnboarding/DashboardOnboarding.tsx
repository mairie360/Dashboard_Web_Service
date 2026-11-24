"use client";
import { useState } from "react";
import { Onboarding } from "@mairie360/lib-components/primitives";

import { bffDashboard } from "../../../../lib/bff-client";

/**
 * The welcome tour: the lib `Onboarding` in a modal, with its five default slides, for a user who has not
 * finished nor skipped it yet (`onboardingCompleted === false`). Nothing is shown when it is done (`true`) or
 * when the BFF could not tell (`null`). « Commencer », « Passer » and Escape record it as done through the BFF
 * and close it; if recording fails, the tour simply shows again on the next visit.
 */
export function DashboardOnboarding({ onboardingCompleted }: { onboardingCompleted: boolean | null | undefined }) {
  const [closed, setClosed] = useState(false);
  if (onboardingCompleted !== false || closed) return null;
  const finish = () => {
    bffDashboard.putDashboardOnboarding().catch(() => undefined);
    setClosed(true);
  };
  return <Onboarding modal onDone={finish} />;
}
