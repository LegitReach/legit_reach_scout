import { buildSubredditPrompt } from "@/app/api/reddit/subreddits/route";

// ─── Mock the Gemini model so tests run without a real API key ───

const mockGenerateContent = jest.fn();

jest.mock("@/ai/gemini.model", () => ({
  getGeminiModel: () => ({
    generateContent: mockGenerateContent,
  }),
}));

// Dynamically import the POST handler AFTER mocks are set up
// We use a lazy import inside each test block so the mock is in place.

async function callPOST(body: Record<string, unknown>) {
  // Next.js route handler expects a NextRequest
  const { NextRequest } = await import("next/server");
  const { POST } = await import("@/app/api/reddit/subreddits/route");

  const request = new NextRequest("http://localhost/api/reddit/subreddits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return POST(request);
}

// ─── Tests ──────────────────────────────────────────────────────

describe("Subreddit Suggestions API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Prompt builder unit tests ──────────────────────────────────

  describe("buildSubredditPrompt", () => {
    it("includes all keywords in the prompt", () => {
      const prompt = buildSubredditPrompt(["saas", "productivity"]);
      expect(prompt).toContain("saas");
      expect(prompt).toContain("productivity");
    });

    it("includes the business description when provided", () => {
      const prompt = buildSubredditPrompt(
        ["saas"],
        "We sell affordable project management tools for small teams."
      );
      expect(prompt).toContain("Business Description:");
      expect(prompt).toContain("affordable project management tools");
    });

    it("omits business description section when not provided", () => {
      const prompt = buildSubredditPrompt(["saas"]);
      expect(prompt).not.toContain("Business Description:");
    });

    it("requests exactly 10 subreddits", () => {
      const prompt = buildSubredditPrompt(["devtools"]);
      expect(prompt).toContain("exactly 10");
    });

    it("requests JSON array output format", () => {
      const prompt = buildSubredditPrompt(["devtools"]);
      expect(prompt).toContain("JSON array");
    });
  });

  // ── POST handler integration tests (Gemini mocked) ────────────

  describe("POST /api/reddit/subreddits", () => {
    it("returns 400 when keywords are missing", async () => {
      const res = await callPOST({});
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it("returns a suggestions array of strings", async () => {
      const fakeSubreddits = [
        "r/startups", "r/SaaS", "r/smallbusiness", "r/Entrepreneur",
        "r/marketing", "r/webdev", "r/productivity", "r/business",
        "r/technology", "r/learnprogramming",
      ];

      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify(fakeSubreddits) },
      });

      const res = await callPOST({ keywords: "saas,productivity" });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(Array.isArray(json.suggestions)).toBe(true);

      // Every element must be a string
      json.suggestions.forEach((s: unknown) => {
        expect(typeof s).toBe("string");
      });
    });

    it("returns exactly 10 suggestions", async () => {
      const fakeSubreddits = [
        "r/startups", "r/SaaS", "r/smallbusiness", "r/Entrepreneur",
        "r/marketing", "r/webdev", "r/productivity", "r/business",
        "r/technology", "r/learnprogramming",
      ];

      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify(fakeSubreddits) },
      });

      const res = await callPOST({ keywords: "saas,productivity" });
      const json = await res.json();
      expect(json.suggestions).toHaveLength(10);
    });

    it("truncates to 10 if the model returns more", async () => {
      const tooMany = Array.from({ length: 15 }, (_, i) => `r/sub${i}`);

      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify(tooMany) },
      });

      const res = await callPOST({ keywords: "tech" });
      const json = await res.json();
      expect(json.suggestions).toHaveLength(10);
    });

    it("normalizes subreddit names to start with r/", async () => {
      const mixed = [
        "startups", "r/SaaS", "smallbusiness", "r/Entrepreneur",
        "marketing", "r/webdev", "productivity", "r/business",
        "technology", "r/learnprogramming",
      ];

      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify(mixed) },
      });

      const res = await callPOST({ keywords: "tech" });
      const json = await res.json();

      json.suggestions.forEach((s: string) => {
        expect(s.startsWith("r/")).toBe(true);
      });
    });

    it("passes business description to the model when provided", async () => {
      const fakeSubreddits = Array.from({ length: 10 }, (_, i) => `r/sub${i}`);

      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify(fakeSubreddits) },
      });

      await callPOST({
        keywords: "saas",
        businessDescription: "Budget-friendly CRM for freelancers",
      });

      // Verify the prompt sent to Gemini contains the business description
      const calledPrompt = mockGenerateContent.mock.calls[0][0];
      expect(calledPrompt).toContain("Budget-friendly CRM for freelancers");
    });

    it("returns 500 when the model throws an error", async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error("API quota exceeded"));

      const res = await callPOST({ keywords: "saas" });
      expect(res.status).toBe(500);

      const json = await res.json();
      expect(json.error).toBeDefined();
    });
  });
});
