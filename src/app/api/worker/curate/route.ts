import { NextRequest, NextResponse } from "next/server";
import { processCuration, CurationParams } from "@/lib/curation-worker";

/**
 * WORKER API
 * This endpoint is called internally to perform the 20-second curation task.
 * It immediately returns a 202 Accepted response and continues processing
 * in the background (using Vercel's waitUntil or fire-and-forget).
 */
export async function POST(request: NextRequest) {
    const params: CurationParams = await request.json();

    if (!params.jobId || !params.subreddits) {
        return NextResponse.json({ error: "jobId and subreddits are required" }, { status: 400 });
    }

    // FIRE AND FORGET
    // We execute the curation without awaiting it for the response.
    // In a real Vercel environment, we would use waitUntil() if available.
    processCuration(params);

    return NextResponse.json({ status: "accepted", jobId: params.jobId }, { status: 202 });
}
