export interface SelectedCommunity {
  subreddit: string;
  selectionReason: string;
  promotionStance: "friendly" | "neutral" | "strict";
  promotionStanceReason: string;
  alignmentType: "product" | "identity" | "problem";
}

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  selftext?: string;
  permalink: string;
}

export interface CurateData {
  engagement: { post: RedditPost; draftComment: string; whyThisPost: string };
  creation: {
    suggestedTitle: string;
    format: string;
    tone: string;
    contentOutline: string[];
    whatToAvoid: string[];
    postingTips: string;
  };
}

export interface CommunitySlot {
  community: SelectedCommunity;
  data: CurateData | null;
  loading: boolean;
  failed: boolean;
  currentStep: 1 | 2 | "complete";
}

export type Phase = "idle" | "scanning" | "ready" | "error";
