begin;

create table legitbot.members (
  id uuid primary key default extensions.gen_random_uuid(),
  x_user_id text not null unique,
  x_username text,
  x_display_name text,
  clerk_user_id text unique,
  status legitbot.member_status not null default 'lead',
  is_18_confirmed boolean not null default false,
  preferred_timezone text,
  preferred_locale text not null default 'en',
  last_inbound_dm_at timestamptz,
  dm_permission_at timestamptz,
  paused_at timestamptz,
  blocked_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_x_user_id_digits check (x_user_id ~ '^[0-9]+$'),
  constraint members_deleted_state check (
    (status = 'deleted' and deleted_at is not null) or status <> 'deleted'
  )
);

comment on column legitbot.members.x_user_id is
  'Immutable canonical identity from X. Usernames are mutable display data.';

create trigger members_touch_updated_at
before update on legitbot.members
for each row execute function legitbot.touch_updated_at();

create trigger members_reject_x_user_id_change
before update on legitbot.members
for each row execute function legitbot.reject_x_user_id_change();

create or replace function legitbot.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select member.id
  from legitbot.members as member
  where member.clerk_user_id = nullif(auth.jwt() ->> 'sub', '')
    and member.status <> 'deleted'
  limit 1
$$;

revoke all on function legitbot.current_member_id() from public;

create table legitbot.member_emails (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references legitbot.members(id) on delete cascade,
  email_ciphertext bytea not null,
  email_hash bytea not null unique,
  verification_token_hash bytea unique,
  verification_expires_at timestamptz,
  verified_at timestamptz,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_emails_verification_pair check (
    (verification_token_hash is null and verification_expires_at is null)
    or (verification_token_hash is not null and verification_expires_at is not null)
  )
);

create unique index member_emails_one_primary_per_member
  on legitbot.member_emails (member_id)
  where is_primary;

create trigger member_emails_touch_updated_at
before update on legitbot.member_emails
for each row execute function legitbot.touch_updated_at();

create table legitbot.consent_events (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references legitbot.members(id) on delete cascade,
  kind legitbot.consent_kind not null,
  status legitbot.consent_status not null,
  policy_version text not null,
  collection_source text not null,
  evidence jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  recorded_at timestamptz not null default now()
);

create index consent_events_current_lookup
  on legitbot.consent_events (member_id, kind, occurred_at desc, recorded_at desc);

create view legitbot.current_consents
with (security_invoker = true)
as
select distinct on (member_id, kind)
  id,
  member_id,
  kind,
  status,
  policy_version,
  collection_source,
  occurred_at
from legitbot.consent_events
order by member_id, kind, occurred_at desc, recorded_at desc;

create table legitbot.member_profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null unique references legitbot.members(id) on delete cascade,
  role_title text,
  organization text,
  space_sectors text[] not null default '{}',
  geography text,
  timezone text,
  needs jsonb not null default '[]'::jsonb,
  offers jsonb not null default '[]'::jsonb,
  introduction_preferences jsonb not null default '{}'::jsonb,
  source_facts jsonb not null default '[]'::jsonb,
  member_confirmed_at timestamptz,
  human_reviewed_at timestamptz,
  reviewed_by text,
  embedding extensions.vector(1536),
  embedding_model text,
  embedding_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger member_profiles_touch_updated_at
before update on legitbot.member_profiles
for each row execute function legitbot.touch_updated_at();

create index member_profiles_embedding_hnsw
  on legitbot.member_profiles
  using hnsw (embedding extensions.vector_cosine_ops);

create table legitbot.profile_enrichment_items (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references legitbot.members(id) on delete cascade,
  source_type text not null check (source_type in ('x_bio', 'x_link', 'x_public_post')),
  external_id text,
  source_published_at timestamptz,
  content_ciphertext bytea,
  content_sha256 text not null,
  extracted_facts jsonb not null default '[]'::jsonb,
  retained_until timestamptz not null default (now() + interval '12 months'),
  created_at timestamptz not null default now(),
  unique (member_id, source_type, external_id)
);

comment on table legitbot.profile_enrichment_items is
  'Consent-gated public-X enrichment. Application code limits posts to 25 from the previous 90 days.';

create table legitbot.member_blocks (
  blocker_member_id uuid not null references legitbot.members(id) on delete cascade,
  blocked_member_id uuid not null references legitbot.members(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (blocker_member_id, blocked_member_id),
  constraint member_blocks_not_self check (blocker_member_id <> blocked_member_id)
);

create table legitbot.messages (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references legitbot.members(id) on delete cascade,
  channel legitbot.message_channel not null,
  direction legitbot.message_direction not null,
  external_message_id text,
  external_conversation_id text,
  sender_external_id text,
  recipient_external_id text,
  content_ciphertext bytea,
  content_sha256 text,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  received_at timestamptz,
  retained_until timestamptz not null default (now() + interval '12 months'),
  redacted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (channel, external_message_id)
);

create index messages_member_timeline
  on legitbot.messages (member_id, created_at desc);
create index messages_retention_due
  on legitbot.messages (retained_until)
  where redacted_at is null;

create table legitbot.approval_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  kind legitbot.approval_kind not null,
  status legitbot.approval_status not null default 'pending',
  subject_member_id uuid references legitbot.members(id) on delete set null,
  nonce_hash bytea not null unique,
  payload jsonb not null,
  proposed_content_ciphertext bytea,
  edited_content_ciphertext bytea,
  owner_x_user_id text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approval_resolution_consistency check (
    (status = 'pending' and consumed_at is null)
    or status <> 'pending'
  )
);

create index approval_requests_owner_queue
  on legitbot.approval_requests (owner_x_user_id, status, expires_at);

create trigger approval_requests_touch_updated_at
before update on legitbot.approval_requests
for each row execute function legitbot.touch_updated_at();

create table legitbot.operators (
  id uuid primary key default extensions.gen_random_uuid(),
  clerk_user_id text not null unique,
  x_user_id text not null unique,
  role text not null default 'operator' check (role in ('owner', 'operator', 'reviewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger operators_touch_updated_at
before update on legitbot.operators
for each row execute function legitbot.touch_updated_at();

create table legitbot.matches (
  id uuid primary key default extensions.gen_random_uuid(),
  member_a_id uuid not null references legitbot.members(id) on delete cascade,
  member_b_id uuid not null references legitbot.members(id) on delete cascade,
  requested_by_member_id uuid references legitbot.members(id) on delete set null,
  state legitbot.match_state not null default 'candidate_ranked',
  structured_fit_score numeric(5, 4),
  reciprocal_fit_score numeric(5, 4),
  embedding_score numeric(5, 4),
  overall_score numeric(5, 4),
  rationale_ciphertext bytea,
  rationale_model text,
  approval_request_id uuid references legitbot.approval_requests(id) on delete set null,
  expires_at timestamptz,
  introduced_at timestamptz,
  outcome_code text,
  outcome_details_ciphertext bytea,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_distinct_members check (member_a_id <> member_b_id),
  constraint matches_structured_score check (structured_fit_score between 0 and 1),
  constraint matches_reciprocal_score check (reciprocal_fit_score between 0 and 1),
  constraint matches_embedding_score check (embedding_score between 0 and 1),
  constraint matches_overall_score check (overall_score between 0 and 1)
);

create index matches_member_a_timeline on legitbot.matches (member_a_id, created_at desc);
create index matches_member_b_timeline on legitbot.matches (member_b_id, created_at desc);

create trigger matches_touch_updated_at
before update on legitbot.matches
for each row execute function legitbot.touch_updated_at();

create table legitbot.match_offers (
  id uuid primary key default extensions.gen_random_uuid(),
  match_id uuid not null references legitbot.matches(id) on delete cascade,
  member_id uuid not null references legitbot.members(id) on delete cascade,
  sequence smallint not null check (sequence in (1, 2)),
  decision legitbot.match_decision not null default 'pending',
  offered_at timestamptz not null default now(),
  decided_at timestamptz,
  expires_at timestamptz not null,
  response_message_id uuid references legitbot.messages(id) on delete set null,
  unique (match_id, member_id),
  unique (match_id, sequence)
);

create table legitbot.introductions (
  id uuid primary key default extensions.gen_random_uuid(),
  match_id uuid not null unique references legitbot.matches(id) on delete cascade,
  state legitbot.introduction_state not null default 'awaiting_email_verification',
  resend_message_id text unique,
  email_thread_key text unique,
  subject_ciphertext bytea,
  introduced_at timestamptz,
  reminder_due_at timestamptz,
  progress_check_due_at timestamptz,
  outcome_check_due_at timestamptz,
  completed_at timestamptz,
  retained_until timestamptz not null default (now() + interval '12 months'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger introductions_touch_updated_at
before update on legitbot.introductions
for each row execute function legitbot.touch_updated_at();

create table legitbot.introduction_participants (
  introduction_id uuid not null references legitbot.introductions(id) on delete cascade,
  member_id uuid not null references legitbot.members(id) on delete cascade,
  member_email_id uuid not null references legitbot.member_emails(id) on delete restrict,
  accepted_at timestamptz not null,
  email_verified_at timestamptz,
  last_replied_at timestamptz,
  primary key (introduction_id, member_id)
);

create table legitbot.audit_events (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_type text not null check (actor_type in ('member', 'owner', 'system', 'integration')),
  actor_id text,
  subject_member_id uuid references legitbot.members(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  request_id text,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index audit_events_subject_timeline
  on legitbot.audit_events (subject_member_id, occurred_at desc);
create index audit_events_request_lookup
  on legitbot.audit_events (request_id)
  where request_id is not null;

create table legitbot.privacy_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references legitbot.members(id) on delete cascade,
  request_type text not null check (
    request_type in ('export', 'correction', 'pause', 'unpause', 'block', 'deletion')
  ),
  status legitbot.job_status not null default 'pending',
  request_message_id uuid references legitbot.messages(id) on delete set null,
  details_ciphertext bytea,
  requested_at timestamptz not null default now(),
  due_at timestamptz,
  completed_at timestamptz,
  result_location_ciphertext bytea,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index privacy_requests_queue
  on legitbot.privacy_requests (status, due_at, requested_at);

create trigger privacy_requests_touch_updated_at
before update on legitbot.privacy_requests
for each row execute function legitbot.touch_updated_at();

create table legitbot.webhook_events (
  id uuid primary key default extensions.gen_random_uuid(),
  provider text not null check (provider in ('x', 'stripe', 'resend', 'qstash', 'clerk')),
  external_event_id text not null,
  event_type text not null,
  signature_verified boolean not null,
  payload_ciphertext bytea,
  payload_sha256 text not null,
  status legitbot.job_status not null default 'pending',
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  retained_until timestamptz not null default (now() + interval '12 months'),
  unique (provider, external_event_id)
);

create table legitbot.outbox_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  job_type text not null,
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  status legitbot.job_status not null default 'pending',
  available_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 8 check (max_attempts > 0),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index outbox_jobs_claimable
  on legitbot.outbox_jobs (available_at, created_at)
  where status in ('pending', 'failed');

create trigger outbox_jobs_touch_updated_at
before update on legitbot.outbox_jobs
for each row execute function legitbot.touch_updated_at();

create table legitbot.plan_entitlements (
  plan legitbot.plan_code primary key,
  monthly_price_cents integer not null check (monthly_price_cents >= 0),
  monthly_match_proposals integer not null check (monthly_match_proposals >= 0),
  watched_companies_limit integer,
  monthly_api_credits integer not null check (monthly_api_credits >= 0),
  export_formats text[] not null default '{}',
  review_priority smallint not null check (review_priority between 1 and 3),
  updated_at timestamptz not null default now(),
  constraint plan_watch_limit check (
    watched_companies_limit is null or watched_companies_limit >= 0
  )
);

insert into legitbot.plan_entitlements (
  plan,
  monthly_price_cents,
  monthly_match_proposals,
  watched_companies_limit,
  monthly_api_credits,
  export_formats,
  review_priority
)
values
  ('free', 0, 3, 3, 100, '{}', 1),
  ('premium', 9900, 15, 25, 10000, '{csv}', 2),
  ('elite', 49900, 50, null, 100000, '{csv,json,parquet}', 3);

create table legitbot.subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references legitbot.members(id) on delete cascade,
  product_key text not null default 'legitbot' check (product_key = 'legitbot'),
  plan legitbot.plan_code not null default 'free',
  status legitbot.subscription_status not null default 'active',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_one_current_per_member
  on legitbot.subscriptions (member_id)
  where status in ('incomplete', 'trialing', 'active', 'past_due', 'paused');

create trigger subscriptions_touch_updated_at
before update on legitbot.subscriptions
for each row execute function legitbot.touch_updated_at();

create table legitbot.monthly_entitlement_usage (
  member_id uuid not null references legitbot.members(id) on delete cascade,
  usage_month date not null,
  match_proposals integer not null default 0 check (match_proposals >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (member_id, usage_month),
  constraint usage_month_first_day check (usage_month = date_trunc('month', usage_month)::date)
);

create trigger monthly_entitlement_usage_touch_updated_at
before update on legitbot.monthly_entitlement_usage
for each row execute function legitbot.touch_updated_at();

create table legitbot.credit_grants (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references legitbot.members(id) on delete cascade,
  bucket legitbot.credit_bucket not null,
  original_credits integer not null check (original_credits > 0),
  remaining_credits integer not null check (remaining_credits >= 0),
  period_start timestamptz,
  expires_at timestamptz,
  stripe_payment_id text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  constraint credit_grants_remaining_bound check (remaining_credits <= original_credits),
  constraint credit_grants_expiration check (
    (bucket = 'monthly' and expires_at is not null)
    or (bucket = 'purchased' and expires_at is null)
  )
);

create index credit_grants_consumption_order
  on legitbot.credit_grants (
    member_id,
    bucket,
    expires_at nulls last,
    created_at
  )
  where remaining_credits > 0;

create table legitbot.api_keys (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references legitbot.members(id) on delete cascade,
  key_hash bytea not null unique,
  key_prefix text not null,
  key_last_four text not null,
  label text not null,
  scopes text[] not null default '{read}',
  status legitbot.api_key_status not null default 'active',
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint api_keys_no_plaintext_shape check (
    length(key_prefix) between 3 and 16 and length(key_last_four) = 4
  )
);

comment on column legitbot.api_keys.key_hash is
  'Keyed hash of the customer credential. The plaintext key is displayed once and never stored.';

create table legitbot.api_usage_events (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references legitbot.members(id) on delete cascade,
  api_key_id uuid references legitbot.api_keys(id) on delete set null,
  request_id text not null unique,
  route text not null,
  operation text not null,
  credits_charged integer not null check (credits_charged > 0),
  response_status integer not null check (response_status between 100 and 599),
  response_rows integer,
  occurred_at timestamptz not null default now()
);

create index api_usage_events_member_timeline
  on legitbot.api_usage_events (member_id, occurred_at desc);

create table legitbot.credit_ledger (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references legitbot.members(id) on delete cascade,
  grant_id uuid references legitbot.credit_grants(id) on delete restrict,
  usage_event_id uuid references legitbot.api_usage_events(id) on delete restrict,
  entry_type legitbot.credit_entry_type not null,
  bucket legitbot.credit_bucket not null,
  credits_delta integer not null check (credits_delta <> 0),
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint credit_ledger_debit_sign check (
    (entry_type in ('debit', 'expiration') and credits_delta < 0)
    or (entry_type in ('grant', 'refund') and credits_delta > 0)
    or entry_type = 'adjustment'
  )
);

create index credit_ledger_member_timeline
  on legitbot.credit_ledger (member_id, created_at desc);

commit;
