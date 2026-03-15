import { stripe } from "@/lib/stripe";
import { redis } from "@/lib/redis";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session.metadata?.userId;

        if (userId) {
            console.log(`Payment successful for user ${userId}. Adding 5 credits.`);
            // Add 5 credits to the user's account in Redis
            await redis.incrby(`credits:user:${userId}`, 5);
        }
    }

    return NextResponse.json({ received: true });
}
