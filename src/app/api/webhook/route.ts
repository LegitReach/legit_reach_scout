/* eslint-disable @typescript-eslint/no-explicit-any */
import { stripe } from "@/lib/stripe";
import { getAdminClient } from "@/lib/supabaseServer";
import { getPostHogClient } from "@/lib/posthog-server";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const CREDITS_PER_PURCHASE = 30;

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

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session.metadata?.userId;

        if (userId) {
            console.log(`[webhook] payment completed — user: ${userId}, adding ${CREDITS_PER_PURCHASE} credits`);

            const supabase = getAdminClient();
            const { error } = await supabase.from("user_subscriptions").upsert(
                {
                    user_id:           userId,
                    plan:              "paid",
                    credits_remaining: CREDITS_PER_PURCHASE,
                    last_curated_date: null,
                },
                { onConflict: "user_id" }
            );

            if (error) {
                console.error(`[webhook] Supabase upsert failed for user ${userId}:`, error.message);
            }

            getPostHogClient().capture({
                distinctId: userId,
                event: "payment_completed",
                properties: {
                    credits_added:     CREDITS_PER_PURCHASE,
                    amount_usd:        79,
                    stripe_session_id: session.id,
                },
            });
        }
    }

    return NextResponse.json({ received: true });
}
