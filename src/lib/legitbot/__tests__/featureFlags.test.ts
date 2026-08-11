import {
  getLegitBotFeatureFlags,
  parseBooleanEnvironmentValue,
} from "../featureFlags";

describe("LegitBot feature flags", () => {
  test.each([
    ["true", true],
    ["1", true],
    ["YES", true],
    ["on", true],
    ["false", false],
    ["0", false],
    ["No", false],
    ["off", false],
  ])("parses %s", (input, expected) => {
    expect(parseBooleanEnvironmentValue("FLAG", input)).toBe(expected);
  });

  it("rejects ambiguous values", () => {
    expect(() => parseBooleanEnvironmentValue("FLAG", "enabled")).toThrow(
      "FLAG must be one of",
    );
  });

  it("keeps every capability off when the product flag is off", () => {
    expect(
      getLegitBotFeatureFlags({
        LEGITBOT_ENABLED: "false",
        LEGITBOT_BILLING_ENABLED: "true",
        LEGITBOT_X_AUTOMATION_ENABLED: "true",
      }),
    ).toMatchObject({
      enabled: false,
      billing: false,
      xAutomation: false,
      xConciergeMode: false,
    });
  });

  it("defaults to concierge mode when LegitBot is enabled", () => {
    const flags = getLegitBotFeatureFlags({ LEGITBOT_ENABLED: "true" });
    expect(flags.enabled).toBe(true);
    expect(flags.xConciergeMode).toBe(true);
    expect(flags.xAutomation).toBe(false);
  });

  it("lets the emergency switch override every capability", () => {
    const flags = getLegitBotFeatureFlags({
      LEGITBOT_ENABLED: "true",
      LEGITBOT_MATCHING_ENABLED: "true",
      LEGITBOT_EMERGENCY_DISABLE: "true",
    });
    expect(flags.emergencyDisabled).toBe(true);
    expect(flags.enabled).toBe(false);
    expect(flags.matching).toBe(false);
  });
});
