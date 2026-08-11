export type Environment = Readonly<Record<string, string | undefined>>;

export type LegitBotFeatureFlags = Readonly<{
  enabled: boolean;
  admin: boolean;
  billing: boolean;
  dataApi: boolean;
  ingestion: boolean;
  matching: boolean;
  emailIntroductions: boolean;
  alerts: boolean;
  xAutomation: boolean;
  xConciergeMode: boolean;
  publicPosting: boolean;
  analytics: boolean;
  emergencyDisabled: boolean;
}>;

export const LEGITBOT_FEATURE_FLAG_KEYS = [
  "LEGITBOT_ENABLED",
  "LEGITBOT_ADMIN_ENABLED",
  "LEGITBOT_BILLING_ENABLED",
  "LEGITBOT_DATA_API_ENABLED",
  "LEGITBOT_INGESTION_ENABLED",
  "LEGITBOT_MATCHING_ENABLED",
  "LEGITBOT_EMAIL_INTROS_ENABLED",
  "LEGITBOT_ALERTS_ENABLED",
  "LEGITBOT_X_AUTOMATION_ENABLED",
  "LEGITBOT_X_CONCIERGE_MODE",
  "LEGITBOT_PUBLIC_POSTING_ENABLED",
  "LEGITBOT_ANALYTICS_ENABLED",
  "LEGITBOT_EMERGENCY_DISABLE",
] as const;

export function parseBooleanEnvironmentValue(
  name: string,
  value: string | undefined,
  defaultValue = false,
): boolean {
  if (value === undefined || value.trim() === "") return defaultValue;

  switch (value.trim().toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    case "0":
    case "false":
    case "no":
    case "off":
      return false;
    default:
      throw new Error(
        `${name} must be one of true, false, 1, 0, yes, no, on, or off`,
      );
  }
}

/**
 * Returns effective server-side flags. Child capabilities cannot become active
 * unless LegitBot itself is enabled, and the emergency switch wins over every
 * other setting. X concierge mode intentionally defaults on so an unapproved X
 * API integration never silently becomes the user-facing path.
 */
export function getLegitBotFeatureFlags(
  environment: Environment = process.env,
): LegitBotFeatureFlags {
  const emergencyDisabled = parseBooleanEnvironmentValue(
    "LEGITBOT_EMERGENCY_DISABLE",
    environment.LEGITBOT_EMERGENCY_DISABLE,
  );
  const enabled =
    parseBooleanEnvironmentValue(
      "LEGITBOT_ENABLED",
      environment.LEGITBOT_ENABLED,
    ) && !emergencyDisabled;
  const childFlag = (name: string, value: string | undefined) =>
    enabled && parseBooleanEnvironmentValue(name, value);

  return Object.freeze({
    enabled,
    admin: childFlag(
      "LEGITBOT_ADMIN_ENABLED",
      environment.LEGITBOT_ADMIN_ENABLED,
    ),
    billing: childFlag(
      "LEGITBOT_BILLING_ENABLED",
      environment.LEGITBOT_BILLING_ENABLED,
    ),
    dataApi: childFlag(
      "LEGITBOT_DATA_API_ENABLED",
      environment.LEGITBOT_DATA_API_ENABLED,
    ),
    ingestion: childFlag(
      "LEGITBOT_INGESTION_ENABLED",
      environment.LEGITBOT_INGESTION_ENABLED,
    ),
    matching: childFlag(
      "LEGITBOT_MATCHING_ENABLED",
      environment.LEGITBOT_MATCHING_ENABLED,
    ),
    emailIntroductions: childFlag(
      "LEGITBOT_EMAIL_INTROS_ENABLED",
      environment.LEGITBOT_EMAIL_INTROS_ENABLED,
    ),
    alerts: childFlag(
      "LEGITBOT_ALERTS_ENABLED",
      environment.LEGITBOT_ALERTS_ENABLED,
    ),
    xAutomation: childFlag(
      "LEGITBOT_X_AUTOMATION_ENABLED",
      environment.LEGITBOT_X_AUTOMATION_ENABLED,
    ),
    xConciergeMode:
      enabled &&
      parseBooleanEnvironmentValue(
        "LEGITBOT_X_CONCIERGE_MODE",
        environment.LEGITBOT_X_CONCIERGE_MODE,
        true,
      ),
    publicPosting: childFlag(
      "LEGITBOT_PUBLIC_POSTING_ENABLED",
      environment.LEGITBOT_PUBLIC_POSTING_ENABLED,
    ),
    analytics: childFlag(
      "LEGITBOT_ANALYTICS_ENABLED",
      environment.LEGITBOT_ANALYTICS_ENABLED,
    ),
    emergencyDisabled,
  });
}
