import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getAuthenticatedClient } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {

  console.error("[scan/GET] - started");

  const { userId, getToken } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getToken();
  if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

  const supabase = getAuthenticatedClient(token);

  const { data, error } = await supabase
    .from("brand_scans")
    .select("id, store_url, brand_profile, communities")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  // PGRST116 = no rows found — valid for first-time users
  if (error) {
    console.error("[scan/GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? null });
}

export async function POST(req: NextRequest) {

  console.error("[scan/POST] - started");

  const { userId, getToken } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getToken();
  if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

  const body = await req.json();
  const { storeUrl, brandProfile, slots } = body;

  if (!storeUrl || !brandProfile || !slots) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getAuthenticatedClient(token);

  const { data, error } = await supabase
    .from("brand_scans")
    .upsert(
      {
        user_id:       userId,
        store_url:     storeUrl,
        brand_profile: brandProfile,
        communities:   (slots as any[]).map(({ community }) => ({ community })),
        updated_at:    new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("[scan/POST]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, scanId: data.id });
}
