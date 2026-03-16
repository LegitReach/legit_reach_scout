import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/ai/gemini.model";
import { withRateLimit } from "@/lib/withRateLimit";
import { parseAIReply, GeminiParseError } from "@/lib/gemini-parsers";
import { getPostHogClient } from "@/lib/posthog-server";
import { getAuth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";

const MODEL_NAME = "gemini-2.5-flash";

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

  const { userId } = getAuth(request);
  const traceId = randomUUID();
  const startTime = Date.now();

  try {
    const result = await getGeminiModel(MODEL_NAME).generateContent(body.prompt);
    const latency = (Date.now() - startTime) / 1000;
    const rawText = result.response.text();
    const usage = result.response.usageMetadata;

    getPostHogClient().capture({
      distinctId: userId ?? "anonymous",
      event: "$ai_generation",
      properties: {
        $ai_trace_id: traceId,
        $ai_span_name: "reply_generation",
        $ai_model: MODEL_NAME,
        $ai_provider: "google",
        $ai_input: [{ role: "user", content: body.prompt }],
        $ai_input_tokens: usage?.promptTokenCount,
        $ai_output_tokens: usage?.candidatesTokenCount,
        $ai_output_choices: [{ role: "assistant", content: rawText }],
        $ai_latency: latency,
      },
    });

    const parsed = parseAIReply(rawText);
    return NextResponse.json({ text: parsed.reply });
  } catch (err) {
    const latency = (Date.now() - startTime) / 1000;
    getPostHogClient().capture({
      distinctId: userId ?? "anonymous",
      event: "$ai_generation",
      properties: {
        $ai_trace_id: traceId,
        $ai_span_name: "reply_generation",
        $ai_model: MODEL_NAME,
        $ai_provider: "google",
        $ai_input: [{ role: "user", content: body.prompt }],
        $ai_latency: latency,
        $ai_is_error: true,
        $ai_error: err instanceof Error ? err.message : String(err),
      },
    });

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
