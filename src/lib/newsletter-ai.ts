import { getGeminiModel } from "@/ai/gemini.model";

const MODEL_NAME = "gemini-2.0-flash"; // Using reliable flash for fast query generation

export interface SearchQuery {
  query: string;
  intent_category: "Pain Point" | "Advice" | "Competitive";
  reasoning: string;
}

/**
 * GENERATE SEARCH QUERIES: Uses Gemini to turn business context into tactical Reddit search strings.
 */
export async function generateSearchQueries(
  businessPitch: string,
  keywords: string[]
): Promise<SearchQuery[]> {
  const prompt = `
You are a world-class Reddit Growth Marketer and Search Specialist. 
Your goal is to generate 3-5 high-intent Reddit search queries to find potential customers for the following business:

BUSINESS DESCRIPTION:
"${businessPitch}"

CORE KEYWORDS:
${keywords.join(", ")}

---
REDDIT SEARCH STRATEGY:
Generate queries that target these specific high-value intent buckets:
1. PAIN POINTS: Users expressing frustration with the status quo (e.g., "sick of", "problem with", "expensive").
2. ADVICE/RECOMMENDATIONS: Users asking for the "best way" or "tool for" (e.g., "can anyone suggest", "recommendations for").
3. COMPETITIVE PIVOT: Users looking for alternatives to major competitors (e.g., "alternative to [Competitor Name]", "vs [Competitor Name]").

RULES:
- Use Reddit's search syntax (quotes for phrases, OR for multiple terms).
- Keep queries tactical and realistic.
- Avoid overly broad single-word searches.

---
OUTPUT FORMAT:
Return ONLY a valid JSON array of objects with the following structure:
[
  {
    "query": "string (the raw reddit search string)",
    "intent_category": "string (Pain Point | Advice | Competitive)",
    "reasoning": "string (1 sentence explaining why this finds leads)"
  }
]
`;

  try {
    const model = getGeminiModel(MODEL_NAME);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean potential markdown wrapping if Gemini includes it
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const queries: SearchQuery[] = JSON.parse(cleanJson);
    
    return queries;
  } catch (error) {
    console.error("Failed to generate search queries with Gemini:", error);
    // Fallback to simple keyword queries if AI fails
    return keywords.slice(0, 3).map(kw => ({
      query: `"${kw}"`,
      intent_category: "Pain Point",
      reasoning: "Fallback query based on provided keyword."
    }));
  }
}
