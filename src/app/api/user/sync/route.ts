import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getAuthenticatedClient } from "@/lib/supabaseServer";

/**
 * Iteration 2: The Sync API
 * This route is called by the frontend whenever we need to push
 * client-side onboarding data (localStorage) to Supabase.
 * It uses the Clerk token to ensure the action respects RLS.
 */

export async function POST(req: NextRequest) {
    try {
        const { userId, getToken, isAuthenticated } = getAuth(req);


        if (!isAuthenticated) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get the session token from Clerk (automated Supabase-ready token)
        const token = await getToken();

        if (!token) {
            return NextResponse.json({ error: "Could not retrieve auth token" }, { status: 401 });
        }

        // 2. Extract onboarding data from request body
        const body = await req.json();
        const { oneMinuteBusinessPitch, keywords, selectedCommunities } = body;

        // 3. Create a Supabase client bound to this user
        const supabase = getAuthenticatedClient(token);
        // 4. Perform the "Smart Upsert"
        // Note: 'user_id' is automatically populated in your schema, but we pass it anyway.
        const { data, error } = await supabase
            .from("onboarding_details")
            .upsert(
                {
                    business_pitch: oneMinuteBusinessPitch,
                    keywords: keywords,
                    subreddits: selectedCommunities,
                    user_id: userId
                },
                { onConflict: "user_id" }
            )
            .select();

        if (error) {
            console.error("Supabase sync error:", error);
            // If we hit a 403 here, it means the RLS policy is blocking the JWT
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Onboarding data synced successfully",
            data
        });

    } catch (err) {
        console.error("Onboarding sync failed:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { userId, getToken } = getAuth(req);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = await getToken();

        if (!token) {
            return NextResponse.json({ error: "Could not retrieve auth token" }, { status: 401 });
        }

        const supabase = getAuthenticatedClient(token);

        const { data, error } = await supabase
            .from("onboarding_details")
            .select("*")
            .eq("user_id", userId)
            .single();

        // PGRST116 is the code for "0 rows returned" (which is common for new users)
        if (error && error.code !== "PGRST116") {
            console.error("Supabase fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: data || null
        });

    } catch (err) {
        console.error("Onboarding fetch failed:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
