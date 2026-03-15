import { stripe } from "@/lib/stripe";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const origin = req.headers.get("origin") || req.nextUrl.origin;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "5 Additional Requests",
                            description: "Get 5 more requests to scout subreddits",
                        },
                        unit_amount: 100, // $1.00
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${origin}/dashboard?success=true`,
            cancel_url: `${origin}/subscribe?canceled=true`,
            metadata: {
                userId,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Stripe error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
