import { getGeminiModel } from "@/ai/gemini.model";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/withRateLimit";
// This API route uses Reddit MCP to search for relevant subreddits based on keywords

async function handler(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const keywords = searchParams.get("keywords") || "";

    if (!keywords) {
        return NextResponse.json({ error: "Keywords parameter is required" }, { status: 400 });
    }

    try {
        const keywordList = keywords.toLowerCase().split(",").map(k => k.trim());

        // const result = await getGeminiModel().generateContent(`
        //     Give me reddit subreddit names relevant to the following keywords: ${keywords}. The format of the output should be a string array of subreddits
        //     . Suggest me only the top 10 relevant subreddits. Make it a good diverse combination.
        //     `);

        // const aiResponse = result.response.text();
        // console.log(aiResponse)
        // const subreddits: string[] = JSON.parse(aiResponse);
    const subreddits = [
      "r/todayilearned",
      "r/SipsTea",
      "r/InternetIsBeautiful",
      "r/DataIsBeautiful",
        "r/CasualConversation"
    ]
        return NextResponse.json({
            keywords: keywordList,
            suggestions: subreddits,
            source: "gemini_api",
        });
    } catch (error) {
        console.error("Subreddit suggestion error:", error);
        return NextResponse.json({ error: "Failed to find subreddits" }, { status: 500 });
    }
}

export const GET = withRateLimit(handler, 5);
