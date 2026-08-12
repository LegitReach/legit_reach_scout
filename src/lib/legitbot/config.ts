import {
  type Environment,
  getLegitBotFeatureFlags,
  type LegitBotFeatureFlags,
} from "./featureFlags";

export type LegitBotEnvironmentCheck = Readonly<{
  flags: LegitBotFeatureFlags;
  missing: readonly string[];
  warnings: readonly string[];
}>;

const CORE_SERVER_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "LEGITBOT_FIELD_ENCRYPTION_KEY",
  "LEGITBOT_API_KEY_PEPPER",
] as const;

const CAPABILITY_KEYS = {
  admin: ["LEGITBOT_OWNER_CLERK_USER_IDS"],
  billing: [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "LEGITBOT_STRIPE_PREMIUM_PRICE_ID",
    "LEGITBOT_STRIPE_ELITE_PRICE_ID",
    "LEGITBOT_STRIPE_CREDITS_1000_PRICE_ID",
    "LEGITBOT_STRIPE_CREDITS_3000_PRICE_ID",
    "LEGITBOT_STRIPE_CREDITS_10000_PRICE_ID",
  ],
  dataApi: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  ingestion: [
    "QSTASH_TOKEN",
    "QSTASH_CURRENT_SIGNING_KEY",
    "QSTASH_NEXT_SIGNING_KEY",
  ],
  matching: ["GEMINI_API_KEY"],
  emailIntroductions: ["RESEND_API_KEY", "RESEND_WEBHOOK_SECRET"],
  xAutomation: [
    "X_API_KEY",
    "X_API_SECRET",
    "X_ACCESS_TOKEN",
    "X_ACCESS_TOKEN_SECRET",
    "X_ACCOUNT_ACTIVITY_WEBHOOK_SECRET",
  ],
} as const satisfies Partial<
  Record<keyof LegitBotFeatureFlags, readonly string[]>
>;

function isMissing(environment: Environment, key: string): boolean {
  return !environment[key]?.trim();
}

/**
 * Validates only capabilities that are effectively enabled. It never returns
 * secret values, making the result safe to log in deployment diagnostics.
 */
export function checkLegitBotEnvironment(
  environment: Environment = process.env,
): LegitBotEnvironmentCheck {
  const flags = getLegitBotFeatureFlags(environment);
  const required = new Set<string>();

  if (flags.enabled) {
    for (const key of CORE_SERVER_KEYS) required.add(key);
  }

  for (const [capability, keys] of Object.entries(CAPABILITY_KEYS)) {
    if (!flags[capability as keyof LegitBotFeatureFlags]) continue;
    for (const key of keys) required.add(key);
  }

  const missing = [...required].filter((key) => isMissing(environment, key));
  const warnings: string[] = [];

  if (flags.xAutomation && flags.xConciergeMode) {
    warnings.push(
      "X automation and concierge mode are both enabled; concierge mode should remain authoritative until X launch gates pass.",
    );
  }
  if (flags.publicPosting && !flags.xAutomation) {
    warnings.push(
      "Public posting is enabled without X automation, so approved drafts cannot be published through the API.",
    );
  }

  return Object.freeze({
    flags,
    missing: Object.freeze(missing),
    warnings: Object.freeze(warnings),
  });
}

export function assertLegitBotEnvironment(
  environment: Environment = process.env,
): LegitBotFeatureFlags {
  const result = checkLegitBotEnvironment(environment);
  if (result.missing.length > 0) {
    throw new Error(
      `Missing LegitBot environment variables: ${result.missing.join(", ")}`,
    );
  }
  return result.flags;
}
