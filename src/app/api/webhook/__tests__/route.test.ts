const mockConstructEvent = jest.fn();
const mockHeaders = jest.fn();
const mockUpsert = jest.fn();
const mockFrom = jest.fn(() => ({ upsert: mockUpsert }));
const mockGetAdminClient = jest.fn(() => ({ from: mockFrom }));
const mockCapture = jest.fn();

jest.mock("@/lib/stripe", () => ({
  stripe: { webhooks: { constructEvent: mockConstructEvent } },
}));
jest.mock("@/lib/supabaseServer", () => ({
  getAdminClient: mockGetAdminClient,
}));
jest.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({ capture: mockCapture }),
}));
jest.mock("next/headers", () => ({ headers: mockHeaders }));
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

import type { NextRequest } from "next/server";
import { POST } from "../route";

describe("Stripe webhook CPO regressions", () => {
  const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let consoleError: jest.SpyInstance;
  let consoleLog: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    consoleLog = jest.spyOn(console, "log").mockImplementation(() => undefined);
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    mockHeaders.mockResolvedValue(
      new Headers({ "Stripe-Signature": "stripe-signature" }),
    );
    mockUpsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    consoleError.mockRestore();
    consoleLog.mockRestore();
  });

  afterAll(() => {
    if (originalWebhookSecret === undefined) {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
    }
  });

  function requestWithBody(body: string): NextRequest {
    return { text: async () => body } as unknown as NextRequest;
  }

  it("rejects an event whose Stripe signature cannot be verified", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    const response = await POST(requestWithBody("raw-event"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid signature" });
    expect(mockConstructEvent).toHaveBeenCalledWith(
      "raw-event",
      "stripe-signature",
      "whsec_test",
    );
    expect(mockGetAdminClient).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "Webhook signature verification failed.",
      "bad signature",
    );
  });

  it("continues dispatching legacy checkout completion to 30 CPO credits", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_legacy",
          metadata: { userId: "user_legacy" },
        },
      },
    });

    const response = await POST(requestWithBody("raw-event"));

    expect(mockFrom).toHaveBeenCalledWith("user_subscriptions");
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: "user_legacy",
        plan: "paid",
        credits_remaining: 30,
        last_curated_date: null,
      },
      { onConflict: "user_id" },
    );
    expect(mockCapture).toHaveBeenCalledWith({
      distinctId: "user_legacy",
      event: "payment_completed",
      properties: {
        credits_added: 30,
        amount_usd: 79,
        stripe_session_id: "cs_legacy",
      },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(consoleLog).toHaveBeenCalledWith(
      "[webhook] payment completed — user: user_legacy, adding 30 credits",
    );
  });
});
