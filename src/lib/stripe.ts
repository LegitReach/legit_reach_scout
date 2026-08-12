import Stripe from "stripe";

let client: Stripe | undefined;

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  client ??= new Stripe(secretKey);
  return client;
}

/**
 * Preserve the existing `stripe.checkout...` caller API without constructing a
 * client while Next.js is only discovering routes during a build.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, property) {
    const stripeClient = getStripeClient();
    const value = Reflect.get(stripeClient, property, stripeClient);
    return typeof value === "function" ? value.bind(stripeClient) : value;
  },
});
