"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./morning.module.css";
import { useApp } from "@/context/AppContext";
import RedditList from "@/components/RedditList";
import { getGeminiModel } from "@/ai/gemini.model";
interface RedditPost {
    id: string;
    title: string;
    subreddit: string;
    author: string;
    score: number;
    num_comments: number;
    created_utc: number;
    selftext: string;
    permalink: string;
    url: string;
    relevance_score?: number;
    opportunity_type?: string;
}

interface RedditPostQuery {
    keywords: string;
}

export default function MorningPage() {
    const { onboarding } = useApp();
    const {keywords, oneMinuteBusinessPitch} = onboarding;

    const [redditPosts , setRedditPosts] = useState<RedditPost[]>([]);
    const [loading, setLoading] = useState(false);
    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return; // guard against Strict Mode double-run
        startedRef.current = true;

        const controller = new AbortController();


        async function load() {
            setLoading(true);
        const prompt = `
            I am using https://app.scrapecreators.com/playground. which allows to scrape reddit data. To search reddit posts there is a required parameter: 'query'. Based on the pitch: ${oneMinuteBusinessPitch} and keywords: ${keywords.join(', ')}.
            I want you to formulate a relevant query using no more than 140 characters.
            the query should be comma separated values. Only mention 3 most relevant keywords
            the response should be in the below format:
            interface QueryGen {
                keywords: string
            } 
            `;

    try {
        const result = await getGeminiModel('gemini-3-flash-preview').generateContent(prompt);
        const text = result.response.text();
        
        console.log('suggestions by gemini: ', text);

        const postQuery:RedditPostQuery = JSON.parse(text);

        const keywordList = postQuery.keywords ? postQuery.keywords.split(",").map(k => k.trim())  : [];

        const allRedditPosts: RedditPost[] =  [];
        const options = {
            method: 'GET',
            headers: {
                "x-api-key": "oAbSyVotIvV15azse6gwt40A2lu1"
            }
        };


        for (const keyword of keywordList){
            const url = `https://api.scrapecreators.com/v1/reddit/search?query=${keyword}&sort=top&timeframe=day`;
            const response = await fetch(url, options);
            const relevantRedditResponse = await response.json();
            if(relevantRedditResponse['posts']){
                const tempRedditPost: RedditPost[] = relevantRedditResponse['posts'];
                allRedditPosts.push(...tempRedditPost);
            } 
        }

        console.log(allRedditPosts)


        const selectionPrompt  = `
             You are a marketing genius,  based on the client's Pitch: ${oneMinuteBusinessPitch} select the top 5 most relevant reddit posts from the list: ${JSON.stringify(allRedditPosts)}
             such that the posts could potentially bring the client some valuable business or interaction with potential customers

             CRITICAL: ONLY SELECT FROM THE MENTIONED RedditPosts. you do not have to do ANYTHING ELSE
            the response should be an array of the below objects: 
                interface RedditPost {
                        id: string;
                        title: string;
                        subreddit: string;
                        author: string;
                        score: number;
                        num_comments: number;
                        created_utc: number;
                        selftext: string;
                        permalink: string;
                        url: string;
                        relevance_score?: number;
                        opportunity_type?: string;
                }

             `

        const aiResponse = await getGeminiModel('gemini-3-flash-preview').generateContent(selectionPrompt);
        const textRedditResponse = aiResponse.response.text()    

        // 2. IGNORE the text for links. Use the Metadata instead.
                if (!textRedditResponse) {
                    setRedditPosts([]);
                    return;
                }

                let posts: RedditPost[] = JSON.parse(textRedditResponse);
                posts = posts.map((post, idx) => ({
                    ...post,
                    permalink: `https://reddit.com${post.permalink}`,
                }));
                

                setRedditPosts(posts || []);
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error('Failed to load morning posts', err);
                setRedditPosts([]);
            } finally {
                setLoading(false);
            }
        }

        load();
        return () => { controller.abort(); };
    }, []);
    return (
        <div className={styles.page}>
            <main className={styles.content}>
                {(!onboarding.selectedCommunities || onboarding.selectedCommunities.length === 0) ? (
                    <div className={styles.empty}>
                        <p>No communities selected yet — complete onboarding to see personalized content.</p>
                    </div>
                ) : loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Fetching top opportunities...</p>
                    </div>
                ) : (
                    <section>

                        {/* Render any posts fetched by the page's logic */}
                        {redditPosts && redditPosts.length > 0 && (
                            <div style={{ marginTop: 20 }}>
                                <h3>Top Matches</h3>
                                <RedditList posts={redditPosts} />
                            </div>
                        )}

                    </section>
                )}
            </main>
        </div>
    );
}
