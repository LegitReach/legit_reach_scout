/**
 * Pure parsing helpers for Gemini JSON responses.
 * These are the functions under unit test — they are intentionally
 * decoupled from the HTTP layer so Jest can import them without
 * needing a running Next.js server.
 */
import {
  isAIGeneratedReply,
  isAIQueryResult,
  isCurateResponse,
  type AIGeneratedReply,
  type AIQueryResult,
  type CurateResponse,
} from "@/types";

export class GeminiParseError extends Error {
  constructor(
    message: string,
    public readonly raw: string,
  ) {
    super(message);
    this.name = "GeminiParseError";
  }
}

/**
 * Parse a raw JSON string from Gemini into an {@link AIGeneratedReply}.
 * Throws {@link GeminiParseError} if the JSON is malformed or the shape is wrong.
 */
export function parseAIReply(rawJson: string): AIGeneratedReply {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new GeminiParseError("Invalid JSON from Gemini", rawJson);
  }
  if (!isAIGeneratedReply(parsed)) {
    throw new GeminiParseError(
      `Expected { reply: string }, got: ${JSON.stringify(parsed)}`,
      rawJson,
    );
  }
  return parsed;
}

/**
 * Parse a raw JSON string from Gemini into an {@link AIQueryResult}.
 * Throws {@link GeminiParseError} if the JSON is malformed or the shape is wrong.
 */
export function parseAIQueryResult(rawJson: string): AIQueryResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new GeminiParseError("Invalid JSON from Gemini", rawJson);
  }
  if (!isAIQueryResult(parsed)) {
    throw new GeminiParseError(
      `Expected { keywords: string }, got: ${JSON.stringify(parsed)}`,
      rawJson,
    );
  }
  return parsed;
}

/**
 * Parse a raw JSON string from Gemini into a {@link CurateResponse}.
 * Throws {@link GeminiParseError} if the JSON is malformed or the shape is wrong.
 */
export function parseCurateResponse(rawJson: string): CurateResponse {
  const cleaned = rawJson.replace(/```json|```/g, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new GeminiParseError("Invalid JSON from Gemini", cleaned);
  }
  if (!isCurateResponse(parsed)) {
    throw new GeminiParseError(
      `Response did not match CurateResponse shape: ${JSON.stringify(parsed)}`,
      cleaned,
    );
  }
  return parsed;
}
