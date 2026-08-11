const mockGetAuth = jest.fn();
const mockCreateCheckoutSession = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({ getAuth: mockGetAuth }));
jest.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: { sessions: { create: mockCreateCheckoutSession } },
  },
}));
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

describe("legacy CPO checkout contract", () => {
  beforeEach(() => {
    mockGetAuth.mockReset();
    mockCreateCheckoutSession.mockReset();
  });

  it("keeps the one-time $79 purchase for 30 scans and legacy redirects", async () => {
    mockGetAuth.mockReturnValue({ userId: "user_legacy" });
    mockCreateCheckoutSession.mockResolvedValue({
      url: "https://checkout.stripe.test/session",
    });
    const request = {
      headers: new Headers({ origin: "https://legitreach.com" }),
      nextUrl: { origin: "https://fallback.test" },
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "30 Brand Scans",
              description:
                "30 Reddit community blueprint scans - one per day for 30 days",
            },
            unit_amount: 7900,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://legitreach.com/dashboard?success=true",
      cancel_url: "https://legitreach.com/dashboard?canceled=true",
      metadata: { userId: "user_legacy" },
    });
    await expect(response.json()).resolves.toEqual({
      url: "https://checkout.stripe.test/session",
    });
  });

  it("does not create a checkout session for an anonymous request", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const request = {
      headers: new Headers(),
      nextUrl: { origin: "https://legitreach.com" },
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
  });
});
