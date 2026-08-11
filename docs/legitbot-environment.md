# LegitBot environment and release controls

LegitBot integrations are server-controlled and disabled by default. Copy
`.env.example` to `.env.local` for development, populate only the integrations
being exercised, and keep `.env.local` out of source control.

## Safe activation order

1. Apply the Supabase migrations and configure Clerk's X/Twitter v2 connection.
2. Set the shared Supabase and Clerk variables plus the two LegitBot security
   values.
3. Enable `LEGITBOT_ENABLED`; keep `LEGITBOT_X_CONCIERGE_MODE=true`.
4. Enable one capability at a time after its credentials and external launch
   gates are verified.
5. Enable X automation only after Account Activity, DM permissions, signature
   verification, rate-limit handling, and encrypted-Chat smoke tests pass.

`LEGITBOT_EMERGENCY_DISABLE=true` overrides the product and every child flag.
It is the first-response kill switch for an integration incident. Capability
flags cannot turn on a feature while `LEGITBOT_ENABLED=false`.

## Capability requirements

| Capability flag | Required server variables |
| --- | --- |
| `LEGITBOT_ENABLED` | Supabase URL/service role, Clerk keys, field-encryption key, API-key pepper |
| `LEGITBOT_ADMIN_ENABLED` | Owner Clerk user-ID allowlist |
| `LEGITBOT_BILLING_ENABLED` | Stripe secret/webhook secret and all five LegitBot Price IDs |
| `LEGITBOT_DATA_API_ENABLED` | Upstash Redis REST URL/token |
| `LEGITBOT_INGESTION_ENABLED` | QStash token and both signing keys |
| `LEGITBOT_MATCHING_ENABLED` | Gemini API key |
| `LEGITBOT_EMAIL_INTROS_ENABLED` | Resend API key/webhook secret |
| `LEGITBOT_X_AUTOMATION_ENABLED` | X consumer/access credentials and Account Activity webhook secret |

Browser analytics additionally requires `NEXT_PUBLIC_LEGITBOT_ANALYTICS_ENABLED=true`
and the visitor's explicit opt-in. Keep it false in credential-free previews.

The validator in `src/lib/legitbot/config.ts` reports missing variable **names**
only; it never returns secret values. Run it at the boundary of a worker or
route that needs the capability rather than at module import time, so disabled
features do not break previews.

## Secret handling

- Never prefix secrets with `NEXT_PUBLIC_`. Only the Clerk publishable key and
  intentionally public PostHog configuration belong in browser bundles.
- Generate `LEGITBOT_FIELD_ENCRYPTION_KEY` as an independent 32-byte random key
  and store its base64 representation in the deployment secret manager. Use it
  for message/email ciphertext; do not store plaintext communication bodies.
- Generate `LEGITBOT_API_KEY_PEPPER` separately. Customer API keys are displayed
  once and persisted only as a keyed hash, prefix, and last four characters.
- Rotate integration credentials individually. Keep the previous QStash signing
  key configured during its documented rotation window.
- The Supabase service-role key is server-only and bypasses RLS. Browser code
  must use the publishable key with a Clerk session token.
- Never send DM/email bodies, decrypted email addresses, or sensitive member
  profile fields to analytics or application logs.
- Set `LEGITBOT_OWNER_CLERK_USER_IDS` to a comma-separated allowlist. Clerk
  authentication alone never grants access to the operator console.

## External launch gates

Credentials alone do not authorize production activation. X automation also
requires developer enrollment, paid access, Account Activity approval, DM
permissions, user-initiated messaging compliance, and tests against both legacy
DMs and encrypted Chat. Resend introductions require verified sending DNS and a
dedicated inbound domain. Stripe automatic tax, Customer Portal, webhook
destinations, and Price metadata must be configured in the live account.

Until those gates pass, use concierge mode: the system may prepare drafts and
record state, but a human communicates through X. Browser automation of X is
not a fallback.

## Deployment environments

- **Local:** use test/sandbox credentials and leave outbound automation off.
- **Vercel preview:** apply migrations to a non-production Supabase project;
  use Stripe test mode, a Resend test recipient, and concierge mode.
- **Production:** use dedicated credentials, configure spend/rate alerts, test
  kill switches, and obtain counsel approval before enabling billing, member
  matching, automated X messaging, or customer data redistribution.

Existing `/cpo` variables and Stripe behavior are intentionally independent of
the `LEGITBOT_STRIPE_*` Price IDs. Stripe webhook handlers must route by explicit
product metadata before applying any LegitBot subscription or credit event.
