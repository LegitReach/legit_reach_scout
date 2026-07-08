import { NextRequest, NextResponse } from "next/server";

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

    const webhookUrl = process.env.WAITLIST_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: `Silicon Photonics Monthly waitlist: ${email}`,
          email,
          source: body.source || "site",
          createdAt: new Date().toISOString(),
        }),
      });
    }

    return NextResponse.json({ ok: true, delivered: Boolean(webhookUrl) });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to capture email" },
      { status: 500 },
    );
  }
}
