/**
 * Unit tests: Gemini response type validation
 *
 * These tests verify that:
 *  1. The runtime type-guards in src/types correctly accept valid shapes
 *  2. The runtime type-guards correctly reject invalid shapes
 *  3. The parser helpers in src/lib/gemini-parsers throw on bad input
 *     and return the correct type on good input
 *
 * No network calls are made — all Gemini interaction is mocked.
 */

import {
  isAIGeneratedReply,
  isAIQueryResult,
  isCuratedResult,
  isCurateResponse,
  type AIGeneratedReply,
  type AIQueryResult,
  type CuratedResult,
  type CurateResponse,
} from "@/types";

import {
  parseAIReply,
  parseAIQueryResult,
  parseCurateResponse,
  GeminiParseError,
} from "@/lib/gemini-parsers";

// ─────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────

const validReply: AIGeneratedReply = {
  reply:
    "Great question! Our tool automates exactly that pain point — happy to share more.",
};

const validQueryResult: AIQueryResult = {
  keywords: "customer feedback, productivity tools, team collaboration",
};

const validCuratedResult: CuratedResult = {
  id: "post_abc123",
  ai_relevance_score: 87,
  ai_opportunity_score: 74,
  ai_reasoning:
    "The poster is actively seeking a solution that matches your product.",
  recommended_action: "engage",
};

const validCurateResponse: CurateResponse = {
  curated_posts: [
    validCuratedResult,
    {
      id: "post_def456",
      ai_relevance_score: 42,
      ai_opportunity_score: 31,
      ai_reasoning: "Tangentially related; worth keeping an eye on.",
      recommended_action: "monitor",
    },
    {
      id: "post_ghi789",
      ai_relevance_score: 5,
      ai_opportunity_score: 2,
      ai_reasoning: "Unrelated discussion.",
      recommended_action: "skip",
    },
  ],
  summary:
    "Found 1 high-priority opportunity and 1 post worth monitoring across 3 posts analysed.",
  total_analyzed: 3,
};

// ─────────────────────────────────────────────────────────
// isAIGeneratedReply
// ─────────────────────────────────────────────────────────

describe("isAIGeneratedReply()", () => {
  it("returns true for a valid AIGeneratedReply object", () => {
    expect(isAIGeneratedReply(validReply)).toBe(true);
  });

  it("returns true when reply is an empty string", () => {
    expect(isAIGeneratedReply({ reply: "" })).toBe(true);
  });

  it("returns false when reply is missing", () => {
    expect(isAIGeneratedReply({})).toBe(false);
  });

  it("returns false when reply is not a string", () => {
    expect(isAIGeneratedReply({ reply: 42 })).toBe(false);
    expect(isAIGeneratedReply({ reply: null })).toBe(false);
    expect(isAIGeneratedReply({ reply: ["array"] })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAIGeneratedReply(null)).toBe(false);
  });

  it("returns false for a plain string", () => {
    expect(isAIGeneratedReply("just a string")).toBe(false);
  });

  it("returns false for an array", () => {
    expect(isAIGeneratedReply([])).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// isCuratedResult
// ─────────────────────────────────────────────────────────

describe("isCuratedResult()", () => {
  it("returns true for a valid CuratedResult object", () => {
    expect(isCuratedResult(validCuratedResult)).toBe(true);
  });

  it("accepts all three recommended_action values", () => {
    for (const action of ["engage", "monitor", "skip"] as const) {
      expect(
        isCuratedResult({ ...validCuratedResult, recommended_action: action }),
      ).toBe(true);
    }
  });

  it("returns false when id is missing", () => {
    const { id: _id, ...rest } = validCuratedResult;
    expect(isCuratedResult(rest)).toBe(false);
  });

  it("returns false when ai_relevance_score is not a number", () => {
    expect(
      isCuratedResult({ ...validCuratedResult, ai_relevance_score: "87" }),
    ).toBe(false);
  });

  it("returns false when ai_opportunity_score is not a number", () => {
    expect(
      isCuratedResult({ ...validCuratedResult, ai_opportunity_score: null }),
    ).toBe(false);
  });

  it("returns false when ai_reasoning is not a string", () => {
    expect(isCuratedResult({ ...validCuratedResult, ai_reasoning: 0 })).toBe(
      false,
    );
  });

  it("returns false for an invalid recommended_action value", () => {
    expect(
      isCuratedResult({ ...validCuratedResult, recommended_action: "delete" }),
    ).toBe(false);
    expect(
      isCuratedResult({ ...validCuratedResult, recommended_action: undefined }),
    ).toBe(false);
  });

  it("returns false for null", () => {
    expect(isCuratedResult(null)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// isCurateResponse
// ─────────────────────────────────────────────────────────

describe("isCurateResponse()", () => {
  it("returns true for a valid CurateResponse object", () => {
    expect(isCurateResponse(validCurateResponse)).toBe(true);
  });

  it("returns true when curated_posts is an empty array", () => {
    const r: CurateResponse = {
      curated_posts: [],
      summary: "Nothing found.",
      total_analyzed: 0,
    };
    expect(isCurateResponse(r)).toBe(true);
  });

  it("returns false when curated_posts is missing", () => {
    const { curated_posts: _cp, ...rest } = validCurateResponse;
    expect(isCurateResponse(rest)).toBe(false);
  });

  it("returns false when curated_posts contains an invalid entry", () => {
    const bad = {
      ...validCurateResponse,
      curated_posts: [{ id: "x", ai_relevance_score: "not-a-number" }],
    };
    expect(isCurateResponse(bad)).toBe(false);
  });

  it("returns false when summary is missing", () => {
    const { summary: _s, ...rest } = validCurateResponse;
    expect(isCurateResponse(rest)).toBe(false);
  });

  it("returns false when total_analyzed is not a number", () => {
    expect(
      isCurateResponse({ ...validCurateResponse, total_analyzed: "3" }),
    ).toBe(false);
  });

  it("returns false for null", () => {
    expect(isCurateResponse(null)).toBe(false);
  });

  it("returns false for an array", () => {
    expect(isCurateResponse([])).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// parseAIReply()
// ─────────────────────────────────────────────────────────

describe("parseAIReply()", () => {
  it("parses valid JSON into an AIGeneratedReply", () => {
    const result = parseAIReply(JSON.stringify(validReply));
    expect(result).toEqual(validReply);
    expect(typeof result.reply).toBe("string");
  });

  it("returns the reply string correctly", () => {
    const r = parseAIReply('{"reply":"Hello world"}');
    expect(r.reply).toBe("Hello world");
  });

  it("throws GeminiParseError on invalid JSON", () => {
    expect(() => parseAIReply("{not valid json}")).toThrow(GeminiParseError);
    expect(() => parseAIReply("{not valid json}")).toThrow(
      "Invalid JSON from Gemini",
    );
  });

  it("throws GeminiParseError when JSON is valid but shape is wrong", () => {
    expect(() => parseAIReply('{"text":"wrong key"}')).toThrow(
      GeminiParseError,
    );
    expect(() => parseAIReply('{"reply":123}')).toThrow(GeminiParseError);
    expect(() => parseAIReply("null")).toThrow(GeminiParseError);
  });

  it("throws GeminiParseError for an empty string", () => {
    expect(() => parseAIReply("")).toThrow(GeminiParseError);
  });

  it("preserves the raw string in the error", () => {
    const badInput = '{"wrong":true}';
    try {
      parseAIReply(badInput);
      fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(GeminiParseError);
      expect((e as GeminiParseError).raw).toBe(badInput);
    }
  });
});

// ─────────────────────────────────────────────────────────
// isAIQueryResult
// ─────────────────────────────────────────────────────────

describe("isAIQueryResult()", () => {
  it("returns true for a valid AIQueryResult object", () => {
    expect(isAIQueryResult(validQueryResult)).toBe(true);
  });

  it("returns true when keywords is an empty string", () => {
    expect(isAIQueryResult({ keywords: "" })).toBe(true);
  });

  it("returns false when keywords is missing", () => {
    expect(isAIQueryResult({})).toBe(false);
  });

  it("returns false when keywords is not a string", () => {
    expect(isAIQueryResult({ keywords: 42 })).toBe(false);
    expect(isAIQueryResult({ keywords: ["a", "b"] })).toBe(false);
    expect(isAIQueryResult({ keywords: null })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAIQueryResult(null)).toBe(false);
  });

  it("returns false for a plain string", () => {
    expect(isAIQueryResult("feedback, tools")).toBe(false);
  });

  it("returns false for an array", () => {
    expect(isAIQueryResult([])).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// parseAIQueryResult()
// ─────────────────────────────────────────────────────────

describe("parseAIQueryResult()", () => {
  it("parses valid JSON into an AIQueryResult", () => {
    const result = parseAIQueryResult(JSON.stringify(validQueryResult));
    expect(result).toEqual(validQueryResult);
    expect(typeof result.keywords).toBe("string");
  });

  it("returns the keywords string correctly", () => {
    const r = parseAIQueryResult('{"keywords":"SaaS, feedback, automation"}');
    expect(r.keywords).toBe("SaaS, feedback, automation");
  });

  it("accepts an empty keywords string", () => {
    const r = parseAIQueryResult('{"keywords":""}');
    expect(r.keywords).toBe("");
  });

  it("throws GeminiParseError on invalid JSON", () => {
    expect(() => parseAIQueryResult("{bad json}")).toThrow(GeminiParseError);
    expect(() => parseAIQueryResult("{bad json}")).toThrow(
      "Invalid JSON from Gemini",
    );
  });

  it("throws GeminiParseError when keywords field is missing", () => {
    expect(() => parseAIQueryResult('{"query":"something"}')).toThrow(
      GeminiParseError,
    );
  });

  it("throws GeminiParseError when keywords is not a string", () => {
    expect(() => parseAIQueryResult('{"keywords":["a","b"]}')).toThrow(
      GeminiParseError,
    );
    expect(() => parseAIQueryResult('{"keywords":99}')).toThrow(
      GeminiParseError,
    );
  });

  it("throws GeminiParseError for null JSON value", () => {
    expect(() => parseAIQueryResult("null")).toThrow(GeminiParseError);
  });

  it("preserves the raw string in the error", () => {
    const badInput = '{"wrong":true}';
    try {
      parseAIQueryResult(badInput);
      fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(GeminiParseError);
      expect((e as GeminiParseError).raw).toBe(badInput);
    }
  });
});

// ─────────────────────────────────────────────────────────
// parseCurateResponse()
// ─────────────────────────────────────────────────────────

describe("parseCurateResponse()", () => {
  it("parses a valid CurateResponse JSON string", () => {
    const raw = JSON.stringify(validCurateResponse);
    const result = parseCurateResponse(raw);

    expect(result.total_analyzed).toBe(3);
    expect(result.curated_posts).toHaveLength(3);
    expect(typeof result.summary).toBe("string");
  });

  it("returns curated_posts as an array of CuratedResult objects", () => {
    const result = parseCurateResponse(JSON.stringify(validCurateResponse));

    expect(Array.isArray(result.curated_posts)).toBe(true);
    result.curated_posts.forEach((post) => {
      expect(typeof post.id).toBe("string");
      expect(typeof post.ai_relevance_score).toBe("number");
      expect(typeof post.ai_opportunity_score).toBe("number");
      expect(typeof post.ai_reasoning).toBe("string");
      expect(["engage", "monitor", "skip"]).toContain(post.recommended_action);
    });
  });

  it("accepts an empty curated_posts array", () => {
    const empty: CurateResponse = {
      curated_posts: [],
      summary: "No relevant posts found.",
      total_analyzed: 0,
    };
    const result = parseCurateResponse(JSON.stringify(empty));
    expect(result.curated_posts).toHaveLength(0);
    expect(result.total_analyzed).toBe(0);
  });

  it("throws GeminiParseError on invalid JSON", () => {
    expect(() => parseCurateResponse("oops")).toThrow(GeminiParseError);
    expect(() => parseCurateResponse("oops")).toThrow(
      "Invalid JSON from Gemini",
    );
  });

  it("throws GeminiParseError when curated_posts is missing", () => {
    const bad = JSON.stringify({ summary: "ok", total_analyzed: 1 });
    expect(() => parseCurateResponse(bad)).toThrow(GeminiParseError);
  });

  it("throws GeminiParseError when a curated post has an invalid recommended_action", () => {
    const bad = JSON.stringify({
      curated_posts: [{ ...validCuratedResult, recommended_action: "delete" }],
      summary: "ok",
      total_analyzed: 1,
    });
    expect(() => parseCurateResponse(bad)).toThrow(GeminiParseError);
  });

  it("throws GeminiParseError when summary is not a string", () => {
    const bad = JSON.stringify({ ...validCurateResponse, summary: 42 });
    expect(() => parseCurateResponse(bad)).toThrow(GeminiParseError);
  });

  it("throws GeminiParseError for a null response", () => {
    expect(() => parseCurateResponse("null")).toThrow(GeminiParseError);
  });

  it("preserves the raw string in the error", () => {
    const badInput = '{"bad":"shape"}';
    try {
      parseCurateResponse(badInput);
      fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(GeminiParseError);
      expect((e as GeminiParseError).raw).toBe(badInput);
    }
  });
});
