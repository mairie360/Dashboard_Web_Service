import { frontUrl, type FrontUrlKey } from "@/lib/front-urls";

function configuredFrontUrl(key: FrontUrlKey): string | undefined {
  const value = frontUrl(key)?.trim();
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      return undefined;
    }
    return url.href;
  } catch {
    return undefined;
  }
}

export function getLoginFrontHref() {
  return configuredFrontUrl("LOGIN_FRONT_URL");
}

/** Only configured, active frontend destinations are exposed by the shell. */
export function getActiveFrontHrefs() {
  const settings = configuredFrontUrl("SETTINGS_FRONT_URL");
  return {
    dashboard: "/",
    projects: configuredFrontUrl("PROJECT_FRONT_URL"),
    messages: configuredFrontUrl("MESSAGE_FRONT_URL"),
    training: configuredFrontUrl("ELEARNING_FRONT_URL"),
    calendar: configuredFrontUrl("CALENDAR_FRONT_URL"),
    admin: configuredFrontUrl("ADMINISTRATION_FRONT_URL"),
    settings,
    profile: settings,
  };
}
