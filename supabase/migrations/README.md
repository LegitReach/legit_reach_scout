# LegitBot database migrations

The timestamped migrations create a dedicated `legitbot` schema and do not
alter the existing public-schema tables used by `/cpo`.

Profile embeddings use 1,536 dimensions so the configured Gemini output can be
indexed with pgvector HNSW cosine search. Keep the application output-dimension
setting aligned with the column typmod before writing vectors.

1. `...00100_legitbot_bootstrap.sql` installs `pgcrypto`/`vector`, the schema,
   shared enum types, and trigger helpers.
2. `...00200_legitbot_members_network_billing.sql` creates member identity,
   consent, encrypted communications, matching, approvals, introductions,
   privacy operations, webhook/outbox, plans, subscriptions, API keys, and the
   credit grant/ledger model.
3. `...00300_legitbot_intelligence.sql` creates the license registry, datasets,
   ingestion history, reviewed companies and events, operational launch/space
   weather records, watchlists, and alert delivery records.
4. `...00400_legitbot_rls.sql` enables RLS on every table, denies anonymous
   access, provides narrow member-owned policies, and grants the server-only
   `service_role` access needed by webhook and job workers.

`supabase/config.toml` exposes the namespace to PostgREST for server-side
`.schema("legitbot")` calls. Mirror that exposed-schema setting in the hosted
Supabase project's API settings before deploying a preview.

Apply these to a fresh non-production project first. Generate database types
after migration and keep them in sync whenever the schema changes. Raw source
records may be returned to customers only when the retrieval-time snapshot,
dataset, and current source are all `redistributable`; catalog-only and blocked
records remain service-only.

The schema intentionally contains no market-price table. Do not add or expose a
price feed until a vendor agreement explicitly permits commercial customer
redistribution.
