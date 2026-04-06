# Ad Intel Renderer — LLM Instruction Spec

You receive a raw Facebook Ads Library API response (JSON). Your job is to extract
exactly **5 things** and render them as a minimal visual card for a brand owner.
This spec works for any brand — hardcode nothing except the logic rules below.

---

## Input shape

The API returns a JSON object. The fields you need:

```
response.searchResultsCount          → total active ads (integer)
response.results[]                   → array of ad objects

Each ad object:
  ad.snapshot.page_name              → brand name (string)
  ad.snapshot.page_like_count        → page likes (integer)
  ad.snapshot.page_profile_uri       → facebook page URL (string)
  ad.snapshot.body.text              → main ad copy (string)
  ad.snapshot.title                  → ad headline (string)
  ad.snapshot.display_format         → "IMAGE" or "DCO" (string)
  ad.snapshot.cards[]                → carousel slides (array, present when DCO)
  ad.snapshot.link_url               → destination URL (string)
  ad.start_date                      → unix timestamp (integer)
  ad.start_date_string               → ISO date string
  ad.publisher_platform[]            → array of platform strings
  ad.impressions_with_index          → { impressions_text, impressions_index }
```

---

## The 5 things to extract and show

### 1. Advertiser summary

```
page_name     → from results[0].snapshot.page_name
page_likes    → from results[0].snapshot.page_like_count
total_ads     → response.searchResultsCount
fb_url        → from results[0].snapshot.page_profile_uri
```

Show as a single header line:  
`{page_name} · {page_likes} page likes · {total_ads} active ads`

---

### 2. Four stat cards

**Active ads**
```
value = response.searchResultsCount
```

**Oldest ad running (days)**
```
oldest_ts     = Math.min(...results.map(r => r.start_date))
oldest_date   = new Date(oldest_ts * 1000)
days_running  = Math.floor((Date.now() / 1000 - oldest_ts) / 86400)
sub_label     = "since {Mon DD, YYYY}"
```
A high number here (100+ days) means the creative is converting. Flag it.

**Promo codes found**
Scan every `snapshot.body.text` and every `snapshot.cards[].body` with this regex:
```
/\bcode\s+([A-Z0-9]{3,})/gi
```
Collect unique matches. Count = number of unique codes.  
Sub-label = the codes joined by " · " (e.g. `HEALTH100 · STAY`)

**Platforms**
```
all_platforms = dedupe(results.flatMap(r => r.publisher_platform))
count         = all_platforms.length
sub_label     = abbreviated names joined by " · "
  FACEBOOK         → FB
  INSTAGRAM        → IG
  MESSENGER        → Messenger
  AUDIENCE_NETWORK → Audience
  THREADS          → Threads
```

---

### 3. Campaign themes (bar chart)

Classify each ad into one of 4 themes by scanning `snapshot.body.text` + `snapshot.title`:

| Theme | Match rule |
|---|---|
| **Retargeting** | contains "almost there" OR "still deciding" OR "flexible payment" OR "pay over time" OR "pay later" |
| **Veterans** | contains "veteran" OR " va " OR "va coverage" OR "out-of-pocket" |
| **Social proof** | contains "says " OR "real stories" OR "lifesaver" OR "saved his life" |
| **Promo / discount** | contains "code " + a promo code, OR "limited time offer", OR "save $" in first 60 chars |

Apply rules **in order** — first match wins. If none match, label as "General".

For each theme:
```
count = number of ads matching that theme
pct   = Math.round((count / results.length) * 100)
bar_width = pct + "%"
```

Sort by count descending. Show all themes with count > 0.

---

### 4. Ad format split

```
dco_count   = results.filter(r => r.snapshot.display_format === "DCO").length
image_count = results.filter(r => r.snapshot.display_format === "IMAGE").length
```

Also extract all distinct discount amounts seen across all ad bodies and card bodies:
```
/\$(\d+)\s*off/gi   →  collect unique dollar amounts, e.g. ["$100", "$200", "$250"]
```
Show these as small pills.

---

### 5. Top creatives list

Select up to **4 ads** to show. Priority order:
1. Oldest ad with display_format = "DCO" (strongest longevity signal)
2. Most recent ad with a new theme not yet shown
3. Fill remaining slots with highest-value discount amount seen
4. Fallback: just take the first 4 results

For each selected ad, show:
```
title         → snapshot.title  (truncate at 60 chars)
body_preview  → snapshot.body.text, first 140 chars, strip newlines to spaces
theme_label   → from classification above
format        → "DCO · {cards.length} slides" or "Image"
start_date    → formatted as "running since {Mon DD, YYYY}"
code          → any promo code found in this ad's body (or omit if none)
extra_note    → if link_url contains a path like /veterans, note "separate LP: /{slug}"
```

---

## Rendering rules

- **Advertiser header**: plain text, 15px/500, muted sub-line with meta
- **Stat cards**: 2×2 or 4-across grid. `background: var(--color-background-secondary)`. 22px value, 11px uppercase muted label, 11px muted sub-label beneath.
- **Theme bars**: 5px height, colored fills (use one distinct color per theme — purple for retargeting, blue for veterans, teal for social proof, amber for promo). Label left, count+% right.
- **Format split**: two equal boxes side by side. 20px number, 11px muted label.
- **Discount pills**: small inline pills. Amber ramp (bg: #FAEEDA, text: #633806).
- **Creative cards**: white bg, 0.5px border, 12px body text, 11px muted meta line. Theme pill right-aligned on the title row.
  - Retargeting pill: purple bg `#EEEDFE`, text `#3C3489`
  - Veterans pill: blue bg `#E6F1FB`, text `#0C447C`
  - Social proof pill: teal bg `#E1F5EE`, text `#085041`
  - Promo pill: amber bg `#FAEEDA`, text `#633806`
  - General pill: gray bg `#F1EFE8`, text `#444441`
- No gradients, no shadows. All text colors from CSS variables except pill text.
- Dark mode: all backgrounds use CSS variables, pill colors are hardcoded and remain readable in both modes (light fills with dark text — acceptable).

---

## Edge cases

| Situation | Handle like this |
|---|---|
| `searchResultsCount` is null | use `results.length` instead |
| `body.text` is null or empty | use first `cards[0].body` as fallback |
| `title` is null | use `snapshot.caption` as fallback |
| No promo codes found | show stat card with value "0", no sub-label |
| All ads are IMAGE format | show "0 DCO / {n} image", omit carousel slide count |
| Only 1–2 ads in results | show whatever is available, do not pad |
| `page_like_count` is 0 or null | omit the likes figure from the header |
| Oldest ad is < 30 days | do not flag it as a signal, just show the number |

---

## Output contract

Your output is a **single self-contained HTML fragment** (no `<html>`, `<head>`, or `<body>` tags).
Use only `var(--color-*)` CSS variables for backgrounds and text.
Use inline styles only — no external CSS files.
The fragment must render correctly inside a `width: 100%` container at any width above 320px.
