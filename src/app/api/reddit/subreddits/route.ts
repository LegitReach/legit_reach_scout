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
        
        // Collect relevant subreddits based on keywords
        const relevantSubreddits = new Set<string>();
        for(const keyword of keywordList){
            console.log(keyword);
            const url = `https://reddapi.p.rapidapi.com/api/v2/search/subreddits?query=${keyword}&limit=5`;
            const options = {
                        method: 'GET',
                        headers: {
                            'x-rapidapi-key': '7ca6f694c3mshb75b5cdefb5cf4ep1bdf38jsn2310d6cbee70',
                            'x-rapidapi-host': 'reddapi.p.rapidapi.com'
                        }
                    };
            
                try {
                    const response = await fetch(url, options);
                    const result= await response.json();
                    if(result['subreddits']){
                        const subreddit : Array<any> = result['subreddits'];
                        subreddit.forEach((sub)=>{
                            relevantSubreddits.add(sub['display_name'])
                        });

                    }

                } catch (error) {
                    console.error(error);
                }
        }
        // Format response
        const suggestions = Array.from(relevantSubreddits).map(name => ({
            name,
            display: `r/${name}`,
            relevance: Math.floor(Math.random() * 30) + 70, // 70-100 relevance score
        }));

        // Sort by relevance
        suggestions.sort((a, b) => b.relevance - a.relevance);
        return NextResponse.json({
            keywords: keywordList,
            suggestions: suggestions, // Return top 10
            source: "mcp_simulation", // Will be "mcp" when real
        });
    } catch (error) {
        console.error("Subreddit suggestion error:", error);
        return NextResponse.json({ error: "Failed to find subreddits" }, { status: 500 });
    }
}
