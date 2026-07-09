import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabaseServer";

function isEmail(value: unknown) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!isEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Valid email required" },
        { status: 400 },
      );
    }

    const supabase = getAdminClient();

    await supabase
      .from("newsletter_subscribers")
      .upsert({ email, source: body.source || "site" }, { onConflict: "email", ignoreDuplicates: true });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to capture email" },
      { status: 500 },
    );
  }
}
