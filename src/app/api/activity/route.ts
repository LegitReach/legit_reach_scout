import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getAuthenticatedClient } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const { userId, getToken } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getToken();
  if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

  const scanId = req.nextUrl.searchParams.get("scanId");
  if (!scanId) return NextResponse.json({ error: "Missing scanId" }, { status: 400 });

  const supabase = getAuthenticatedClient(token);
  const today    = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("blueprint_activity")
    .select("progress")
    .eq("user_id", userId)
    .eq("scan_id", parseInt(scanId, 10))
    .eq("date", today)
    .single();

  if (error) {
    // PGRST116 = no row yet for today — not an error, user just hasn't completed any steps
    if (error.code === "PGRST116") return NextResponse.json({ progress: null });
    console.error("[activity/GET]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress: data.progress });
}

export async function POST(req: NextRequest) {
  const { userId, getToken } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getToken();
  if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

  const { scanId, progress } = await req.json();
  if (!scanId || !Array.isArray(progress)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase       = getAuthenticatedClient(token);
  const today          = new Date().toISOString().split("T")[0];
  const fullCompletion = progress.every(
    (p: { step1_completed: boolean; step2_completed: boolean }) =>
      p.step1_completed && p.step2_completed
  );

  const { error } = await supabase
    .from("blueprint_activity")
    .upsert(
      {
        user_id:         userId,
        scan_id:         scanId,
        date:            today,
        progress,
        full_completion: fullCompletion,
        updated_at:      new Date().toISOString(),
      },
      { onConflict: "user_id,scan_id,date" }
    );

  if (error) {
    console.error("[activity/POST]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
