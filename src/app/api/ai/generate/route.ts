import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/ai/gemini.model";
import { withRateLimit } from "@/lib/withRateLimit";
import { parseAIReply, GeminiParseError } from "@/lib/gemini-parsers";

async function handler(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Only POST allowed" }, { status: 405 });
  }

  let body: { prompt?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.prompt) {
    return NextResponse.json(
      { error: "`prompt` field is required" },
      { status: 400 },
    );
  }

  try {
    const result = await getGeminiModel().generateContent(body.prompt);
    const rawText = result.response.text();
    const parsed = parseAIReply(rawText);
    return NextResponse.json({ text: parsed.reply });
  } catch (err) {
    if (err instanceof GeminiParseError) {
      console.error("Gemini response shape mismatch:", err.message);
      return NextResponse.json(
        { error: "AI returned unexpected format" },
        { status: 502 },
      );
    }
    console.error("Generative API error", err);
    return NextResponse.json({ error: "generation failed" }, { status: 500 });
  }
}

export const POST = withRateLimit(handler, 5);
