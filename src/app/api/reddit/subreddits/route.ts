import { getGeminiModel } from "@/ai/gemini.model";
import { NextRequest, NextResponse } from "next/server";
// This API route uses Reddit MCP to search for relevant subreddits based on keywords

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const keywords = searchParams.get("keywords") || "";

    if (!keywords) {
        return NextResponse.json({ error: "Keywords parameter is required" }, { status: 400 });
    }

    try {
        // Call MCP to search for communities related to keywords
        // For now, we'll simulate what MCP would return based on common patterns
        // When MCP is connected, this will use real search_reddit results
        const keywordList = keywords.toLowerCase().split(",").map(k => k.trim());


        const result = await getGeminiModel().generateContent(`
            Give me reddit subreddit names relevant to the following keywords: ${keywords}. The format of the output should be a string array of subreddits
            . Suggest me only the top 10 relevant subreddits. Make it a good diverse combination.
            `)
        
        const aiResponse = result.response.text();
        const subreddits: string[] = JSON.parse(aiResponse);

        return NextResponse.json({
            keywords: keywordList,
            suggestions: subreddits, // Return top 10
            source: "gemini_api",         
        });
    } catch (error) {
        console.error("Subreddit suggestion error:", error);
        return NextResponse.json({ error: "Failed to find subreddits" }, { status: 500 });
    }
}
