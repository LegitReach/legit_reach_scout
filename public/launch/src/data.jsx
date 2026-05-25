// Mock data for the prototype.
// Each website maps to three communities; each community has sentiment,
// trending keywords, posts (Relevance/Hot/Top/New), and blueprint guidance.

const SITES_DB = {
  "legitreach.com": {
    name: "legitreach.com",
    label: "Community intelligence platform",
    communities: [
      {
        id: "c1",
        name: "r/Entrepreneur",
        members: "4.1M",
        active: "2,310 online",
        overlap: 0.74,
        sentiment: [
          { label: "Positive",  value: 47, color: "#5cd197" },
          { label: "Neutral",   value: 28, color: "#888"    },
          { label: "Curious",   value: 16, color: "#f0c054" },
          { label: "Critical",  value: 9,  color: "#e07b7b" },
        ],
        cloud: [
          { t: "organic reach",     w: 56 },
          { t: "founder voice",     w: 48 },
          { t: "ads fatigue",       w: 41 },
          { t: "community-led",     w: 39 },
          { t: "PMF",               w: 34 },
          { t: "cold outreach",     w: 31 },
          { t: "AI slop",           w: 28 },
          { t: "B2B reddit",        w: 26 },
          { t: "audience",          w: 24 },
          { t: "distribution",      w: 22 },
          { t: "warm intro",        w: 19 },
          { t: "low CAC",           w: 17 },
          { t: "newsletter",        w: 16 },
          { t: "Y-Combinator",      w: 14 },
          { t: "founder-led sales", w: 13 },
          { t: "MRR",               w: 11 },
        ],
        posts: [
          { id: "p1", author: "u/dispatch_co",  title: "I killed our $40k/mo ad budget and our pipeline actually grew", score: 1247, comments: 318, age: "3h",  rel: 0.94, hot: 0.91, top: 0.99, new: 0.42, flair: "Discussion" },
          { id: "p2", author: "u/main_st_h",    title: "Founder voice > AI replies — 12 month case study with numbers", score:  642, comments: 184, age: "6h",  rel: 0.89, hot: 0.74, top: 0.82, new: 0.34, flair: "Case Study" },
          { id: "p3", author: "u/late_night_pm",title: "Anyone else completely burnt out on LinkedIn growth-hacks?",     score:  208, comments:  96, age: "1h",  rel: 0.78, hot: 0.96, top: 0.41, new: 0.88, flair: "Vent" },
          { id: "p4", author: "u/saas_in_3yrs", title: "How we got our first 100 customers from Reddit (no ads)",        score:  912, comments: 244, age: "11h", rel: 0.86, hot: 0.62, top: 0.93, new: 0.18, flair: "Lessons" },
          { id: "p5", author: "u/the_kraken",   title: "PMF feels like fog — what helped you finally see it?",            score:   84, comments:  31, age: "22m", rel: 0.71, hot: 0.84, top: 0.22, new: 0.97, flair: "Question" },
          { id: "p6", author: "u/forge_works",  title: "We open-sourced our community-led GTM playbook",                 score:  531, comments: 128, age: "14h", rel: 0.81, hot: 0.51, top: 0.78, new: 0.11, flair: "Resource" },
          { id: "p7", author: "u/q_for_pms",    title: "Stop reading distribution advice from people with no distribution", score: 1421, comments: 392, age: "9h", rel: 0.74, hot: 0.79, top: 0.95, new: 0.27, flair: "Hot Take" },
        ],
        blueprint: [
          { kind: "read",  title: "A post worth reading",
            line: "u/saas_in_3yrs broke down a no-ads path to 100 customers — the comment thread is where the real signal is.",
            postRef: "How we got our first 100 customers from Reddit (no ads)",
            cta: "Open thread" },
          { kind: "join",  title: "Join the conversation",
            line: "u/late_night_pm just opened a vent thread about LinkedIn fatigue. Genuine empathy beats a pitch here — 96 comments and still hot.",
            postRef: "Anyone else completely burnt out on LinkedIn growth-hacks?",
            cta: "Draft reply" },
          { kind: "give",  title: "Give back to the community",
            line: "Three founders are asking how to find PMF. Share the framework you actually used — no link, no funnel, just the answer.",
            postRef: "PMF feels like fog — what helped you finally see it?",
            cta: "Write answer" },
        ],
        trending: {
          author: "u/dispatch_co",
          title: "I killed our $40k/mo ad budget and our pipeline actually grew",
          score: 1247,
          comments: 318,
          age: "3h"
        },
        suggestedComment:
          "We dropped paid last quarter too. The thing nobody talks about: most of the early signal lives in comment threads, not posts. Curious — are you mining the comments or just the OPs?",
        suggestedPost: {
          title: "We tracked 67 founders who quit paid ads. Here is what worked.",
          body: "Pulled this together from a month of customer-discovery calls. Sharing the three patterns that mapped to lower CAC across 14 verticals…"
        }
      },
      {
        id: "c2",
        name: "r/SmallBusiness",
        members: "2.8M",
        active: "1,180 online",
        overlap: 0.61,
        sentiment: [
          { label: "Positive",  value: 38, color: "#5cd197" },
          { label: "Neutral",   value: 34, color: "#888"    },
          { label: "Curious",   value: 14, color: "#f0c054" },
          { label: "Critical",  value: 14, color: "#e07b7b" },
        ],
        cloud: [
          { t: "google reviews",   w: 52 },
          { t: "local SEO",        w: 44 },
          { t: "DM spam",          w: 38 },
          { t: "brand voice",      w: 34 },
          { t: "review farming",   w: 31 },
          { t: "social manager",   w: 28 },
          { t: "automation",       w: 26 },
          { t: "reputation",       w: 24 },
          { t: "facebook groups",  w: 22 },
          { t: "agency churn",     w: 20 },
          { t: "retainer",         w: 17 },
          { t: "ROI",              w: 14 },
          { t: "trust signals",    w: 12 },
        ],
        posts: [
          { id: "p1", author: "u/main_st_bakery",  title: "Our 'social media manager' was just running ChatGPT on autopilot — feel betrayed", score: 892, comments: 241, age: "5h",  rel: 0.96, hot: 0.93, top: 0.92, new: 0.41, flair: "Vent" },
          { id: "p2", author: "u/corner_florist",  title: "Killed our agency retainer. 4 months later: more leads, less spend.",                score: 612, comments: 178, age: "9h",  rel: 0.88, hot: 0.68, top: 0.84, new: 0.22, flair: "Win" },
          { id: "p3", author: "u/cafe_owner_x",    title: "Google review pulled down — what's the actual escalation path in 2026?",             score:  92, comments:  44, age: "38m", rel: 0.74, hot: 0.95, top: 0.18, new: 0.99, flair: "Help" },
          { id: "p4", author: "u/sole_prop_22",    title: "How do I actually sound human online when I am genuinely too busy?",                  score: 188, comments:  72, age: "2h",  rel: 0.81, hot: 0.86, top: 0.32, new: 0.78, flair: "Question" },
          { id: "p5", author: "u/dt_dental",       title: "Audited 8 agencies this quarter. 6 were running pure GPT. AMA.",                       score: 731, comments: 312, age: "14h", rel: 0.85, hot: 0.59, top: 0.88, new: 0.14, flair: "AMA" },
          { id: "p6", author: "u/ts_handmade",     title: "Trust signals that actually moved conversion (no, not badges)",                       score: 421, comments:  98, age: "20h", rel: 0.79, hot: 0.42, top: 0.74, new: 0.08, flair: "Lessons" },
        ],
        blueprint: [
          { kind: "read",  title: "A post worth reading",
            line: "u/dt_dental audited eight social agencies and shared the patterns. The comments are full of owners realising they were paying for bots.",
            postRef: "Audited 8 agencies this quarter. 6 were running pure GPT. AMA.",
            cta: "Open thread" },
          { kind: "join",  title: "Join the conversation",
            line: "u/main_st_bakery is venting about an agency that ran ChatGPT on autopilot. Don't pitch — just acknowledge. Three competitors already tried and were called out.",
            postRef: "Our 'social media manager' was just running ChatGPT on autopilot",
            cta: "Draft reply" },
          { kind: "give",  title: "Give back to the community",
            line: "u/cafe_owner_x needs the real Google review escalation path — most replies are guessing. Share the steps that actually work.",
            postRef: "Google review pulled down — what's the actual escalation path in 2026?",
            cta: "Write answer" },
        ],
        trending: {
          author: "u/main_st_bakery",
          title: "Our 'social media manager' was just running ChatGPT on autopilot — feel betrayed",
          score: 892,
          comments: 241,
          age: "5h"
        },
        suggestedComment:
          "This is the third post like this I've seen this week. The tell is usually reply cadence — too even, no idle hours. Worth asking the agency for their tooling stack on the next renewal.",
        suggestedPost: {
          title: "Audit your agency: 4 reply-pattern checks that catch bot armies in 5 min",
          body: "Sharing the checklist we use internally. Walks through reply-cadence, emoji frequency, and the dead-giveaway 'fluent but generic' tell…"
        }
      },
      {
        id: "c3",
        name: "r/marketing",
        members: "1.5M",
        active: "892 online",
        overlap: 0.58,
        sentiment: [
          { label: "Positive",  value: 41, color: "#5cd197" },
          { label: "Neutral",   value: 31, color: "#888"    },
          { label: "Curious",   value: 18, color: "#f0c054" },
          { label: "Critical",  value: 10, color: "#e07b7b" },
        ],
        cloud: [
          { t: "attribution",      w: 49 },
          { t: "dark social",      w: 42 },
          { t: "LinkedIn fatigue", w: 38 },
          { t: "reddit ads",       w: 34 },
          { t: "GTM motion",       w: 31 },
          { t: "creator economy",  w: 28 },
          { t: "first-touch",      w: 26 },
          { t: "intent data",      w: 22 },
          { t: "content engine",   w: 20 },
          { t: "brand lift",       w: 17 },
          { t: "B2B SaaS",         w: 15 },
          { t: "podcast funnel",   w: 12 },
        ],
        posts: [
          { id: "p1", author: "u/cmo_diaries",     title: "Reddit is the most under-priced B2B channel of 2026. Change my mind.", score: 1842, comments: 487, age: "7h",  rel: 0.97, hot: 0.92, top: 0.98, new: 0.32, flair: "Hot Take" },
          { id: "p2", author: "u/attrib_geek",     title: "Dark social isn't dark, your tracking is bad",                          score:  734, comments: 198, age: "4h",  rel: 0.88, hot: 0.88, top: 0.81, new: 0.62, flair: "Discussion" },
          { id: "p3", author: "u/growth_zoe",      title: "We mapped 100 community threads to revenue. Sharing the spreadsheet.",  score:  512, comments: 142, age: "12h", rel: 0.92, hot: 0.61, top: 0.86, new: 0.16, flair: "Resource" },
          { id: "p4", author: "u/new_to_b2b",      title: "First-touch attribution feels broken for community-led GTM. Help?",     score:  118, comments:  54, age: "44m", rel: 0.80, hot: 0.94, top: 0.24, new: 0.96, flair: "Question" },
          { id: "p5", author: "u/podcast_funnel",  title: "Podcast-first GTM: 18 months in, here is what we'd undo",               score:  398, comments:  88, age: "18h", rel: 0.74, hot: 0.48, top: 0.71, new: 0.09, flair: "Lessons" },
          { id: "p6", author: "u/cmo_redux",       title: "Stop calling everything dark social and just measure intent.",          score:  221, comments:  74, age: "2h",  rel: 0.76, hot: 0.85, top: 0.44, new: 0.82, flair: "Hot Take" },
        ],
        blueprint: [
          { kind: "read",  title: "A post worth reading",
            line: "u/cmo_diaries argues Reddit is the most under-priced B2B channel of 2026 — and the 487-comment debate has the actual receipts.",
            postRef: "Reddit is the most under-priced B2B channel of 2026.",
            cta: "Open thread" },
          { kind: "join",  title: "Join the conversation",
            line: "u/attrib_geek is reframing dark social as bad tracking. CMOs are split — a well-cited counterpoint right now has high upside.",
            postRef: "Dark social isn't dark, your tracking is bad",
            cta: "Draft reply" },
          { kind: "give",  title: "Give back to the community",
            line: "u/new_to_b2b is asking for an attribution model that works for community-led GTM. Share yours, with the failure modes — not just the diagram.",
            postRef: "First-touch attribution feels broken for community-led GTM. Help?",
            cta: "Write answer" },
        ],
        trending: {
          author: "u/cmo_diaries",
          title: "Reddit is the most under-priced B2B channel of 2026. Change my mind.",
          score: 1842,
          comments: 487,
          age: "7h"
        },
        suggestedComment:
          "Hard agree. The compounding part is what most teams miss — a reply from month one keeps surfacing in search forever. We measured a 9× lift on cost-per-qualified-lead vs LinkedIn for the same effort.",
        suggestedPost: {
          title: "Mapping subreddit conversations to closed-won pipeline — what we found",
          body: "Six-month study, 14 SaaS companies, manual + LegitReach tagging. The threads that closed deals weren't the ones with the most upvotes…"
        }
      },
    ]
  },
  "dispatch.co": {
    name: "dispatch.co",
    label: "Headless commerce for indie brands",
    communities: [
      { id: "c1", name: "r/shopify",       members: "320K", active: "412 online", overlap: 0.68 },
      { id: "c2", name: "r/ecommerce",     members: "510K", active: "684 online", overlap: 0.55 },
      { id: "c3", name: "r/indiebiz",      members: "84K",  active: "121 online", overlap: 0.49 },
    ]
  },
  "linenfield.co": {
    name: "linenfield.co",
    label: "Heritage linen, direct from mill",
    communities: [
      { id: "c1", name: "r/malefashionadvice", members: "5.2M", active: "1.8K online", overlap: 0.51 },
      { id: "c2", name: "r/buyitforlife",      members: "1.9M", active: "604 online",  overlap: 0.62 },
      { id: "c3", name: "r/sewing",            members: "830K", active: "298 online",  overlap: 0.41 },
    ]
  }
};

// Default placeholders for the agency-view sites that don't have full data —
// reuse legitreach insights but adapt names lightly.
function getSite(host) {
  const base = SITES_DB[host] || SITES_DB["legitreach.com"];
  if (base.communities[0].cloud) return base;
  const ref = SITES_DB["legitreach.com"];
  return {
    ...base,
    communities: base.communities.map((c, i) => ({
      ...c,
      cloud:     ref.communities[i].cloud,
      sentiment: ref.communities[i].sentiment,
      posts:     ref.communities[i].posts,
      blueprint: ref.communities[i].blueprint,
      trending:  ref.communities[i].trending,
      suggestedComment: ref.communities[i].suggestedComment,
      suggestedPost:    ref.communities[i].suggestedPost,
    }))
  };
}

// Each stage has substages with a counter target the UI can tick up against.
// Totals are tuned to feel like work, not filler.
const LOAD_STAGES = [
  {
    key: "site", label: "indexing site", ms: 5000,
    substages: [
      { msg: "resolving DNS",          counter: { label: "ms",    from: 0, to: 184 } },
      { msg: "fetching homepage",      counter: { label: "kB",    from: 0, to: 412 } },
      { msg: "parsing sitemap",        counter: { label: "urls",  from: 0, to: 142 } },
      { msg: "extracting brand voice", counter: { label: "tokens",from: 0, to: 8400 } },
      { msg: "tagging keywords",       counter: { label: "tags",  from: 0, to: 67 } },
    ],
  },
  {
    key: "sentiment", label: "measuring sentiment", ms: 8000,
    substages: [
      { msg: "scanning subreddits",        counter: { label: "scanned", from: 0, to: 14823 } },
      { msg: "computing semantic distance",counter: { label: "vectors", from: 0, to: 6212 } },
      { msg: "filtering 24h window",       counter: { label: "threads", from: 0, to: 9418 } },
      { msg: "scoring tone",               counter: { label: "scored",  from: 0, to: 1842 } },
      { msg: "ranking keywords",           counter: { label: "terms",   from: 0, to: 16 } },
    ],
  },
  {
    key: "engagement", label: "ranking posts", ms: 7000,
    substages: [
      { msg: "pulling top-of-feed",        counter: { label: "posts",     from: 0, to: 482 } },
      { msg: "scoring relevance",          counter: { label: "scored",    from: 0, to: 482 } },
      { msg: "checking mod rules",         counter: { label: "rules",     from: 0, to: 14 } },
      { msg: "filtering self-promo",       counter: { label: "filtered",  from: 0, to: 28 } },
      { msg: "consolidating shortlist",    counter: { label: "ready",     from: 0, to: 7 } },
    ],
  },
  {
    key: "blueprint", label: "drafting blueprint", ms: 6000,
    substages: [
      { msg: "finding worth-reading post", counter: { label: "candidates", from: 0, to: 47 } },
      { msg: "composing reply angle",      counter: { label: "drafts",     from: 0, to: 6 } },
      { msg: "shaping give-back answer",   counter: { label: "outlines",   from: 0, to: 4 } },
      { msg: "self-promo ratio",           counter: { label: "ratio",      from: 0, to: 12 } },
      { msg: "ready",                      counter: { label: "actions",    from: 0, to: 3 } },
    ],
  },
];

// Old name kept for compatibility.
const LOADING_STAGES = [
  { label: "Authenticating handshake",        detail: "TLS · legitimacy probe",                   ms: 700 },
  { label: "Indexing website",                detail: "crawl · 142 URLs · sitemap parsed",        ms: 1200 },
  { label: "Extracting brand signal",         detail: "tone · vocabulary · positioning",          ms: 900 },
  { label: "Mapping Reddit communities",      detail: "14,800 subreddits · semantic match",       ms: 1300 },
  { label: "Scoring 24h conversation overlap",detail: "language-as-physics · field simulation",   ms: 1100 },
  { label: "Generating community insights",   detail: "human-in-loop ready",                      ms: 900 },
];

Object.assign(window, { SITES_DB, getSite, LOADING_STAGES, LOAD_STAGES });
