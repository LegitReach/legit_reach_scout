import {
  assertLegitBotEnvironment,
  checkLegitBotEnvironment,
} from "../config";

const coreEnvironment = {
  LEGITBOT_ENABLED: "true",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
  CLERK_SECRET_KEY: "test-clerk-secret",
  LEGITBOT_FIELD_ENCRYPTION_KEY: "test-encryption-key",
  LEGITBOT_API_KEY_PEPPER: "test-api-key-pepper",
} as const;

describe("LegitBot environment validation", () => {
  it("does not require integration credentials while LegitBot is disabled", () => {
    const result = checkLegitBotEnvironment({});
    expect(result.missing).toEqual([]);
  });

  it("requires only credentials for enabled capabilities", () => {
    const result = checkLegitBotEnvironment({
      ...coreEnvironment,
      LEGITBOT_MATCHING_ENABLED: "true",
    });
    expect(result.missing).toEqual(["GEMINI_API_KEY"]);
  });

  it("does not expose configured secret values in validation output", () => {
    const result = checkLegitBotEnvironment(coreEnvironment);
    expect(JSON.stringify(result)).not.toContain("test-service-role");
    expect(result.missing).toEqual([]);
  });

  it("throws with the names of missing variables", () => {
    expect(() =>
      assertLegitBotEnvironment({ LEGITBOT_ENABLED: "true" }),
    ).toThrow("SUPABASE_URL");
  });
});
