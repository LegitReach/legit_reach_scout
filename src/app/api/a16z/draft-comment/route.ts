import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/ai/gemini.model";

export interface EngagementPlan {
  intent: string;
  angle: string;
  tone: string;
  mentionProduct: boolean;
  mentionHow: string;
  riskLevel: "Low" | "Medium" | "High";
  riskReason: string;
  draft: string;
}

export async function POST(request: NextRequest) {
  const { postTitle, postBody, subreddit, businessDescription } = await request.json();

  if (!postTitle || !subreddit) {
    return NextResponse.json({ error: "postTitle and subreddit are required" }, { status: 400 });
  }

  const prompt = `You are a seasoned member of ${subreddit} — someone who's been active for years, knows the inside jokes, the recurring debates, the type of post that gets upvoted vs. ignored. You are NOT a brand rep.

A brand wants to engage with this post. Their context:
"${businessDescription || "a brand looking to help people in this community"}"

The post:
Title: "${postTitle}"
${postBody ? `Body: "${postBody}"` : ""}

Analyze this post and return ONLY a valid JSON object — no markdown, no preamble:

{
  "intent": "one sentence — what the person actually wants or feels",
  "angle": "what to lead with — e.g. empathy, specific advice, a reframe, a question back",
  "tone": "e.g. warm and peer-to-peer / direct and practical / empathetic first",
  "mentionProduct": true or false,
  "mentionHow": "if true: exactly how to reference it naturally. If false: empty string",
  "riskLevel": "Low" or "Medium" or "High",
  "riskReason": "one sentence on why — e.g. post is venting, any promotion will backfire",
  "draft": "the actual comment to post — 1 to 3 sentences, sounds like a real long-time community member, no CTAs, no links, no brand name unless mentionProduct is true"
}`;

  try {
    const result = await getGeminiModel().generateContent(prompt);
    const raw = result.response.text().trim().replace(/```json|```/g, "").trim();
    const plan: EngagementPlan = JSON.parse(raw);
    return NextResponse.json({ plan });
  } catch (err) {
    console.error("draft-comment error:", err);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
