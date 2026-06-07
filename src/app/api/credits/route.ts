import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getAuthenticatedClient } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const { userId, getToken } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getToken();
  if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

  const supabase = getAuthenticatedClient(token);

  const { data } = await supabase
    .from("user_subscriptions")
    .select("plan, credits_remaining")
    .eq("user_id", userId)
    .single();

  // No row yet — new user, lazy init will give 3 free credits on first curate
  if (!data) return NextResponse.json({ plan: "free", credits_remaining: 3 });

  return NextResponse.json({ plan: data.plan, credits_remaining: data.credits_remaining });
}
