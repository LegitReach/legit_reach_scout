export interface RedditPost {
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
  upvote_ratio?: number;
  link_flair_text?: string;
  relevance_score?: number;
  opportunity_type?: string;
}
