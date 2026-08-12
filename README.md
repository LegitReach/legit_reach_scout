# LegitReach

LegitReach is a multi-product company building human-approved AI systems. This repository powers the public site and two products:

- **LegitBot** (`/legitbot`) — an X-native superconnector and intelligence platform for the global space industry.
- **CPO** (`/cpo`) — the existing community and brand-operations product. Its routes and $79 scan-credit checkout remain independent from LegitBot.

Production: [legitreach.com](https://legitreach.com)

## LegitBot

LegitBot uses the automated X account [`@get_LegitReach`](https://x.com/get_LegitReach) as its sole conversational interface. It helps opted-in space professionals build reviewed profiles, find reciprocal introductions, monitor public space companies, and access provenance-controlled space data.

The website provides product information, pricing and checkout, legal notices, and a minimal authenticated developer portal. It does not provide a parallel chat interface. Until official X Account Activity and DM access passes production smoke tests, the product runs in human-concierge mode: the system drafts and records work, and a human sends messages on X.

### Product boundaries

- No LinkedIn, SMS, voice calling, phone number, or automated browser control of X.
- A person must initiate a DM or explicitly request contact before automated DMs are allowed.
- Profiles are open to applicants but become matchable only after human review.
- Every beta match and every public post/reply requires operator approval.
- Introductions require two independent opt-ins. Verified email is requested only after a member accepts a first match.
- Company intelligence is factual and sourced, never personalized investment advice.
- Source rights are enforced as `redistributable`, `derived_only`, `catalog_only`, or `blocked`; ambiguous sources default to catalog-only.

## Stack

- Next.js 16 / React 19 / TypeScript
- Clerk authentication (including X/Twitter v2 when configured)
- Supabase Postgres, RLS, and pgvector
- Upstash Redis and QStash for durable asynchronous work
- Stripe subscriptions and prepaid credits
- Resend outbound/inbound email
- Google Gemini via `@google/genai`
- PostHog, Google Analytics, and Clarity, consent-gated on LegitBot routes

## Local development

Requirements: Node.js 20+, npm, and a Supabase project or local Supabase CLI.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Useful checks:

```bash
npm run lint
npm test
npm run build
```

See [`docs/legitbot-environment.md`](docs/legitbot-environment.md) for configuration and feature flags. Database changes are versioned in [`supabase/migrations`](supabase/migrations).

## Routes

| Route | Purpose |
|---|---|
| `/` | LegitReach umbrella landing page |
| `/legitbot` | LegitBot product landing |
| `/legitbot/pricing` | Membership and API-credit pricing |
| `/legitbot/developers` | API documentation and authenticated usage portal |
| `/legitbot/legal/*` | Privacy, terms, data licensing, and disclosures |
| `/legitbot/admin` | Protected operator console |
| `/legitbot/api/v1/*` | Bearer-key customer data API |
| `/cpo/*` | Existing CPO application |
| `/api/checkout` | Existing CPO $79 scan-credit checkout |
| `/api/webhook` | Shared Stripe webhook dispatcher |

## Delivery and safety

External integrations are disabled unless their explicit feature flag and required credentials are present. Webhooks verify signatures, deduplicate events, acknowledge quickly, and queue durable work. API keys are stored as hashes; sensitive content is excluded from analytics and redacted from application logs.

Before production enablement, LegitBot requires X developer access, Clerk X configuration, a verified Resend inbound domain, Stripe Price IDs, database migrations, real DM compatibility tests, and legal review covering global privacy, billing, data licensing, financial-information disclaimers, and export controls.

## License

Proprietary — LegitReach © 2026
