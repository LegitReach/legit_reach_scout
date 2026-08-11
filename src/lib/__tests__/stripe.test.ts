describe("Stripe client credential validation", () => {
  const originalSecret = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    jest.resetModules();
    if (originalSecret === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = originalSecret;
  });

  it("allows the module to load without a secret during route discovery", async () => {
    delete process.env.STRIPE_SECRET_KEY;

    await expect(
      jest.isolateModulesAsync(async () => {
        await import("../stripe");
      }),
    ).resolves.toBeUndefined();
  });

  it("reports the missing credential when Stripe is first used", async () => {
    delete process.env.STRIPE_SECRET_KEY;

    await jest.isolateModulesAsync(async () => {
      const { stripe } = await import("../stripe");
      expect(() => stripe.checkout).toThrow("STRIPE_SECRET_KEY is not set");
    });
  });

  it("preserves the existing Stripe property-based caller API", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";

    await jest.isolateModulesAsync(async () => {
      const { stripe } = await import("../stripe");
      expect(stripe.checkout.sessions.create).toEqual(expect.any(Function));
      expect(stripe.webhooks.constructEvent).toEqual(expect.any(Function));
    });
  });
});
