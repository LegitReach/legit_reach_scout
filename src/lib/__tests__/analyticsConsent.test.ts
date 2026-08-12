import {
  canRunAnalytics,
  getSanitizedPageviewUrl,
  getStoredAnalyticsConsent,
  isLegitBotPath,
  LEGITBOT_ANALYTICS_CONSENT_EVENT,
  LEGITBOT_ANALYTICS_CONSENT_KEY,
  storeAnalyticsConsent,
} from "../analyticsConsent";

describe("LegitBot analytics consent", () => {
  const originalFlag = process.env.NEXT_PUBLIC_LEGITBOT_ANALYTICS_ENABLED;
  let storedValue: string | null;
  let dispatchEvent: jest.Mock;

  beforeEach(() => {
    storedValue = null;
    dispatchEvent = jest.fn();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: jest.fn(() => storedValue),
          setItem: jest.fn((_key: string, value: string) => {
            storedValue = value;
          }),
        },
        dispatchEvent,
      },
    });
    process.env.NEXT_PUBLIC_LEGITBOT_ANALYTICS_ENABLED = "true";
  });

  afterAll(() => {
    if (originalFlag === undefined) {
      delete process.env.NEXT_PUBLIC_LEGITBOT_ANALYTICS_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_LEGITBOT_ANALYTICS_ENABLED = originalFlag;
    }
    Reflect.deleteProperty(globalThis, "window");
  });

  it("recognizes only the LegitBot route namespace", () => {
    expect(isLegitBotPath("/legitbot")).toBe(true);
    expect(isLegitBotPath("/legitbot/pricing")).toBe(true);
    expect(isLegitBotPath("/legitbotany")).toBe(false);
    expect(isLegitBotPath("/cpo")).toBe(false);
  });

  it("requires an explicit grant on non-sensitive LegitBot pages", () => {
    storedValue = null;
    expect(canRunAnalytics("/legitbot")).toBe(false);
    storedValue = "denied";
    expect(canRunAnalytics("/legitbot/pricing")).toBe(false);
    storedValue = "granted";
    expect(canRunAnalytics("/legitbot/pricing")).toBe(true);
  });

  it("never runs on protected LegitBot routes", () => {
    storedValue = "granted";
    expect(canRunAnalytics("/legitbot/admin")).toBe(false);
    expect(canRunAnalytics("/legitbot/admin/approvals")).toBe(false);
    expect(canRunAnalytics("/legitbot/portal")).toBe(false);
    expect(canRunAnalytics("/legitbot/portal/keys")).toBe(false);
  });

  it("preserves analytics behavior outside the LegitBot namespace", () => {
    storedValue = null;
    process.env.NEXT_PUBLIC_LEGITBOT_ANALYTICS_ENABLED = "false";
    expect(canRunAnalytics("/cpo/dashboard")).toBe(true);
    expect(canRunAnalytics("/legitbotany")).toBe(true);
  });

  it("stores a valid choice and emits the consent event", () => {
    storeAnalyticsConsent("granted");

    expect(getStoredAnalyticsConsent()).toBe("granted");
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      LEGITBOT_ANALYTICS_CONSENT_KEY,
      "granted",
    );
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(dispatchEvent.mock.calls[0][0].type).toBe(LEGITBOT_ANALYTICS_CONSENT_EVENT);
  });
});

describe("sanitized pageviews", () => {
  it("retains only origin and pathname", () => {
    expect(
      getSanitizedPageviewUrl(
        "https://legitreach.com/",
        "/legitbot/checkout?plan=elite#payment",
      ),
    ).toBe("https://legitreach.com/legitbot/checkout");
  });

  it("does not serialize query values or fragments", () => {
    const url = getSanitizedPageviewUrl(
      "https://legitreach.com",
      "/legitbot?email=person%40example.com&token=secret#intro",
    );

    expect(url).toBe("https://legitreach.com/legitbot");
    expect(url).not.toContain("person");
    expect(url).not.toContain("secret");
  });
});
