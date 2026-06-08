import type { BrandProfile, SelectedCommunity, TechWeekMagicScanResponse } from "./magic-scan/route";
import type { TechWeekCurateResponse } from "./curate/route";

export const MOCK_BRAND_PROFILE: BrandProfile = {
  tagline: "Safe play from day one",
  businessDescription: "Organic non-toxic baby playmats designed for tummy time and developmental play",
  targetAudience: "New parents aged 25–38 who prioritise safe, natural materials for their babies",
  productCategories: ["baby playmats", "tummy time mats", "developmental play mats"],
  keywords: ["organic baby mat", "tummy time", "non-toxic play mat", "developmental play"],
  brandValues: ["safety", "natural materials", "developmental support"],
  voiceTone: "Warm, science-backed, reassuring without being preachy",
  buyerProblems: [
    "Worried about toxic materials in baby products",
    "Unsure which mat supports development best",
    "Need easy-to-clean yet safe options",
  ],
  nicheScore: 1,
};

export const MOCK_COMMUNITIES: SelectedCommunity[] = [
  {
    subreddit: "r/beyondthebump",
    selectionReason: "Active community for new parents sharing postpartum experiences and product recommendations",
    alignmentType: "problem",
    promotionStance: "neutral",
    promotionStanceReason: "Community allows product mentions when directly relevant to the discussion",
  },
  {
    subreddit: "r/Parenting",
    selectionReason: "Large parenting community with weekly recommendation threads where product mentions fit naturally",
    alignmentType: "product",
    promotionStance: "friendly",
    promotionStanceReason: "Frequent 'what worked for you' threads make honest product experience a natural fit",
  },
  {
    subreddit: "r/NewParents",
    selectionReason: "First-time parent support community — high alignment with buyer problems around safety and development",
    alignmentType: "identity",
    promotionStance: "strict",
    promotionStanceReason: "Strict no-promotion rules; only pure value-add content is welcome here",
  },
];

export const MOCK_MAGIC_SCAN_RESPONSE: TechWeekMagicScanResponse = {
  brandProfile: MOCK_BRAND_PROFILE,
  communities:  MOCK_COMMUNITIES,
  meta: {
    brandName: "BabyNest",
    storeUrl:  "babynest.com",
    ogImage:   "",
  },
};

const MOCK_CURATE_MAP: Record<string, TechWeekCurateResponse> = {
  "beyondthebump": {
    engagement: {
      post: {
        id: "mock_btb_1",
        title: "Tummy time is a STRUGGLE — any tips from parents who've been through this?",
        subreddit: "r/beyondthebump",
        author: "new_parent_2024",
        score: 312,
        num_comments: 87,
        created_utc: Math.floor(Date.now() / 1000) - 3600,
        selftext: "My 6-week-old absolutely hates tummy time. She screams within 30 seconds. We've tried different surfaces but nothing works...",
        permalink: "https://www.reddit.com/r/beyondthebump/comments/mock1",
        url: "https://www.reddit.com/r/beyondthebump/comments/mock1",
        upvote_ratio: 0.97,
        link_flair_text: undefined,
      },
      draftComment: "We had the exact same battle. What finally worked was putting a small mirror flat in front of her — she got so distracted she forgot to complain. Total game changer around week 7.",
      whyThisPost: "High comment velocity, directly maps to your buyer's core problem — a practical tip adds genuine value here.",
    },
    creation: {
      suggestedTitle: "What nobody tells you about tummy time (and what actually worked for us)",
      format: "discussion",
      tone: "Parent sharing a real finding, not a product pitch — peer-to-peer, slightly wry",
      contentOutline: [
        "The tummy time wall every parent hits around week 3",
        "Two things that actually made a difference for us",
        "What the research says about developmental windows",
        "Anyone else find this? Would love to hear what worked",
      ],
      whatToAvoid: [
        "Never mention your brand or product directly",
        "Avoid clinical language — this community prefers conversational tone",
        "Don't lead with stats without a relatable hook first",
      ],
      postingTips: "Best time: weekday mornings 9–11am EST. Keep under 400 words. Use 'Advice' or 'Tips & Tricks' flair if available.",
    },
    communityStats: { subscribers: "4.1M", activeUsers: "1,240 online" },
  },

  "parenting": {
    engagement: {
      post: {
        id: "mock_par_1",
        title: "What's the one baby product you wish you'd bought sooner?",
        subreddit: "r/Parenting",
        author: "dadof2_portland",
        score: 1842,
        num_comments: 634,
        created_utc: Math.floor(Date.now() / 1000) - 7200,
        selftext: "Looking back, there are so many things I wish I'd just bought upfront instead of buying the cheap version first...",
        permalink: "https://www.reddit.com/r/Parenting/comments/mock2",
        url: "https://www.reddit.com/r/Parenting/comments/mock2",
        upvote_ratio: 0.95,
        link_flair_text: undefined,
      },
      draftComment: "Play mats for sure. Bought a basic one first, upgraded 3 months in, genuinely wish we'd just gotten a decent one from the start — the quality difference is real.",
      whyThisPost: "Direct recommendation thread with very high engagement — your product experience fits naturally without feeling promotional.",
    },
    creation: {
      suggestedTitle: "The honest truth about cheap vs premium baby play mats (after using both)",
      format: "advice",
      tone: "Honest parent comparison — slightly opinionated, conversational, not a review-site style writeup",
      contentOutline: [
        "What we started with and why we made the switch",
        "The differences that actually matter day-to-day (and the ones that don't)",
        "What to look for if you're buying now",
        "Happy to answer questions in the comments",
      ],
      whatToAvoid: [
        "Avoid affiliate-link style language or price anchoring",
        "Don't structure it like a product review page — keep it conversational",
        "No direct brand name drops in the post body",
      ],
      postingTips: "Saturday or Sunday morning hits peak traffic here. Aim for 300–500 words. No flair required but 'Gear & Products' works if available.",
    },
    communityStats: { subscribers: "6.2M", activeUsers: "2,108 online" },
  },

  "newparents": {
    engagement: {
      post: {
        id: "mock_np_1",
        title: "First-time parent anxiety is real — how do you actually know if your baby is hitting milestones?",
        subreddit: "r/NewParents",
        author: "firsttimemum_uk",
        score: 567,
        num_comments: 142,
        created_utc: Math.floor(Date.now() / 1000) - 5400,
        selftext: "Every chart I look at makes me panic. My 4 month old isn't doing some of the things they're supposed to...",
        permalink: "https://www.reddit.com/r/NewParents/comments/mock3",
        url: "https://www.reddit.com/r/NewParents/comments/mock3",
        upvote_ratio: 0.98,
        link_flair_text: undefined,
      },
      draftComment: "Milestone charts caused us so much unnecessary stress until our paed explained the ranges are way wider than charts suggest. We switched to watching for progress over exact weeks — much better for everyone's sanity.",
      whyThisPost: "Emotionally resonant, high comment count — a calming, informed reply adds real value and builds trust in the community.",
    },
    creation: {
      suggestedTitle: "Motor development in the first 6 months — what's actually normal vs what to watch for",
      format: "advice",
      tone: "Knowledgeable but warm — experienced parent, not medical professional",
      contentOutline: [
        "Why milestone anxiety spikes around the 3-month mark",
        "The actual range for common motor milestones (wider than most charts show)",
        "Environmental factors that genuinely support development",
        "When it actually makes sense to call your paed",
      ],
      whatToAvoid: [
        "Zero brand or product mentions — strict no-promotion rules in this community",
        "Don't give specific medical advice or claim authority you don't have",
        "Avoid phrases that signal you're a founder or seller",
      ],
      postingTips: "Weekday evenings 7–9pm work well here. Keep under 350 words. Use the 'Advice' flair.",
    },
    communityStats: { subscribers: "890K", activeUsers: "412 online" },
  },
};

// Returns mock curate data for a given subreddit, falling back to the first entry.
export function getMockCurateData(subreddit: string): TechWeekCurateResponse {
  const key = subreddit.replace(/^r\//, "").toLowerCase();
  return MOCK_CURATE_MAP[key] ?? MOCK_CURATE_MAP["beyondthebump"];
}
