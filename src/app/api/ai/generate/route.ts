import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/ai/gemini.model";
import { withRateLimit } from "@/lib/withRateLimit";

async function handler(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Only POST allowed" }, { status: 405 });
  }

  let body: { prompt?: string } = {};
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.prompt) {
    return NextResponse.json({ error: "`prompt` field is required" }, { status: 400 });
  }

  try {
    // const result = await getGeminiModel().generateContent(body.prompt);
    // const text = result.response.text();
    return NextResponse.json({ text: "" });
  } catch (err) {
    console.error("Generative API error", err);
    return NextResponse.json({ error: "generation failed" }, { status: 500 });
  }
}

export const POST = withRateLimit(handler, 5);
