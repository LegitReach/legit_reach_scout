begin;

create table legitbot.sources (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  publisher text not null,
  homepage_url text not null,
  documentation_url text,
  license_name text,
  license_url text,
  license_version text,
  attribution_text text,
  commercial_use_allowed boolean,
  caching_allowed boolean,
  transformation_allowed boolean,
  redistribution_allowed boolean,
  share_alike_required boolean,
  mode legitbot.source_mode not null default 'catalog_only',
  terms_checked_at timestamptz,
  terms_expire_at timestamptz,
  reviewed_by text,
  review_notes text,
  disabled_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sources_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint sources_redistribution_evidence check (
    mode <> 'redistributable'
    or (
      commercial_use_allowed is true
      and redistribution_allowed is true
      and license_url is not null
      and terms_checked_at is not null
    )
  ),
  constraint sources_block_reason check (
    mode <> 'blocked' or disabled_reason is not null
  )
);

comment on table legitbot.sources is
  'License registry. Null rights are unknown and therefore catalog-only; ambiguity never implies permission.';

create trigger sources_touch_updated_at
before update on legitbot.sources
for each row execute function legitbot.touch_updated_at();

create table legitbot.source_reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  source_id uuid not null references legitbot.sources(id) on delete cascade,
  mode legitbot.source_mode not null,
  license_url text,
  license_version text,
  rights_snapshot jsonb not null,
  reviewer text not null,
  notes text,
  reviewed_at timestamptz not null default now()
);

create index source_reviews_timeline
  on legitbot.source_reviews (source_id, reviewed_at desc);

create table legitbot.datasets (
  id uuid primary key default extensions.gen_random_uuid(),
  source_id uuid not null references legitbot.sources(id) on delete restrict,
  slug text not null unique,
  name text not null,
  description text not null,
  upstream_url text not null,
  mode legitbot.source_mode not null default 'catalog_only',
  attribution_text text,
  schema_version text not null default '1',
  freshness_target interval,
  last_successful_sync_at timestamptz,
  next_sync_at timestamptz,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint datasets_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create trigger datasets_touch_updated_at
before update on legitbot.datasets
for each row execute function legitbot.touch_updated_at();

create table legitbot.ingestion_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  dataset_id uuid not null references legitbot.datasets(id) on delete cascade,
  status legitbot.ingestion_status not null default 'queued',
  trigger_type text not null check (trigger_type in ('schedule', 'manual', 'retry', 'webhook')),
  idempotency_key text not null unique,
  schema_version text not null,
  source_terms_checked_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  retrieved_at timestamptz,
  records_seen bigint not null default 0 check (records_seen >= 0),
  records_written bigint not null default 0 check (records_written >= 0),
  records_rejected bigint not null default 0 check (records_rejected >= 0),
  response_checksum text,
  cursor jsonb,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ingestion_runs_dataset_timeline
  on legitbot.ingestion_runs (dataset_id, created_at desc);

create trigger ingestion_runs_touch_updated_at
before update on legitbot.ingestion_runs
for each row execute function legitbot.touch_updated_at();

create table legitbot.dataset_records (
  id uuid primary key default extensions.gen_random_uuid(),
  dataset_id uuid not null references legitbot.datasets(id) on delete cascade,
  ingestion_run_id uuid references legitbot.ingestion_runs(id) on delete set null,
  external_id text not null,
  schema_version text not null,
  source_mode_at_retrieval legitbot.source_mode not null,
  source_license_url_at_retrieval text,
  payload jsonb not null,
  checksum text not null,
  observed_at timestamptz,
  published_at timestamptz,
  retrieved_at timestamptz not null,
  superseded_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (dataset_id, external_id, schema_version, checksum)
);

create index dataset_records_latest_lookup
  on legitbot.dataset_records (dataset_id, external_id, retrieved_at desc);
create index dataset_records_observed_timeline
  on legitbot.dataset_records (dataset_id, observed_at desc);

comment on table legitbot.dataset_records is
  'Normalized or upstream records with a retrieval-time license snapshot. API code must apply the dataset/source mode gate.';

create table legitbot.companies (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  legal_name text not null,
  display_name text not null,
  description text,
  website_url text,
  investor_relations_url text,
  headquarters_country_code char(2),
  exchange_mic text,
  primary_ticker text,
  identifiers jsonb not null default '{}'::jsonb,
  space_sectors text[] not null default '{}',
  inclusion_basis text not null check (
    inclusion_basis in ('primary_space_business', 'material_space_segment', 'strategic_recurring_space_business')
  ),
  inclusion_rationale text not null,
  materiality_evidence_url text not null,
  reviewed_by text,
  reviewed_at timestamptz,
  status legitbot.company_status not null default 'candidate',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint companies_publication_review check (
    status <> 'published' or (reviewed_by is not null and reviewed_at is not null)
  )
);

comment on table legitbot.companies is
  'Reviewed public companies with material space exposure. Stock-price feeds are intentionally absent.';

create trigger companies_touch_updated_at
before update on legitbot.companies
for each row execute function legitbot.touch_updated_at();

create table legitbot.company_evidence (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references legitbot.companies(id) on delete cascade,
  source_id uuid references legitbot.sources(id) on delete restrict,
  evidence_type text not null check (
    evidence_type in ('filing', 'exchange_disclosure', 'investor_relations', 'procurement', 'mission', 'analyst_review')
  ),
  source_url text not null,
  title text not null,
  excerpt text,
  published_at timestamptz,
  retrieved_at timestamptz not null,
  checksum text not null,
  created_at timestamptz not null default now(),
  unique (company_id, source_url, checksum)
);

create table legitbot.company_events (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references legitbot.companies(id) on delete cascade,
  source_id uuid not null references legitbot.sources(id) on delete restrict,
  dataset_record_id uuid references legitbot.dataset_records(id) on delete set null,
  event_type text not null check (
    event_type in ('filing', 'contract', 'launch', 'mission', 'regulatory', 'operational', 'leadership', 'fundamental', 'other')
  ),
  title text not null,
  factual_summary text not null,
  source_url text not null,
  source_external_id text,
  occurred_at timestamptz,
  published_at timestamptz not null,
  retrieved_at timestamptz not null,
  checksum text not null,
  is_critical boolean not null default false,
  publication_status text not null default 'draft' check (
    publication_status in ('draft', 'review_pending', 'published', 'rejected', 'withdrawn')
  ),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, source_external_id, checksum),
  constraint company_events_reviewed_publication check (
    publication_status <> 'published' or (reviewed_by is not null and reviewed_at is not null)
  )
);

create index company_events_company_timeline
  on legitbot.company_events (company_id, published_at desc);
create index company_events_public_timeline
  on legitbot.company_events (published_at desc)
  where publication_status = 'published';

create trigger company_events_touch_updated_at
before update on legitbot.company_events
for each row execute function legitbot.touch_updated_at();

create table legitbot.launches (
  id uuid primary key default extensions.gen_random_uuid(),
  source_id uuid not null references legitbot.sources(id) on delete restrict,
  dataset_record_id uuid references legitbot.dataset_records(id) on delete set null,
  external_id text not null,
  mission_name text not null,
  launch_provider text,
  launch_vehicle text,
  launch_site text,
  window_start timestamptz,
  window_end timestamptz,
  status text not null,
  source_url text not null,
  retrieved_at timestamptz not null,
  publication_status text not null default 'draft' check (
    publication_status in ('draft', 'published', 'withdrawn')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id)
);

create index launches_window on legitbot.launches (window_start);

create trigger launches_touch_updated_at
before update on legitbot.launches
for each row execute function legitbot.touch_updated_at();

create table legitbot.space_weather_events (
  id uuid primary key default extensions.gen_random_uuid(),
  source_id uuid not null references legitbot.sources(id) on delete restrict,
  dataset_record_id uuid references legitbot.dataset_records(id) on delete set null,
  external_id text not null,
  event_type text not null,
  severity text,
  title text not null,
  summary text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  published_at timestamptz,
  source_url text not null,
  retrieved_at timestamptz not null,
  publication_status text not null default 'draft' check (
    publication_status in ('draft', 'published', 'withdrawn')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id)
);

create index space_weather_events_timeline
  on legitbot.space_weather_events ((coalesce(starts_at, published_at)) desc);

create trigger space_weather_events_touch_updated_at
before update on legitbot.space_weather_events
for each row execute function legitbot.touch_updated_at();

create table legitbot.company_watchlists (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references legitbot.members(id) on delete cascade,
  company_id uuid not null references legitbot.companies(id) on delete cascade,
  cadence legitbot.alert_cadence not null default 'critical_and_daily',
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, company_id),
  constraint company_watchlists_quiet_hours_pair check (
    (quiet_hours_start is null and quiet_hours_end is null)
    or (quiet_hours_start is not null and quiet_hours_end is not null)
  )
);

create index company_watchlists_company_members
  on legitbot.company_watchlists (company_id, member_id)
  where cadence <> 'paused';

create trigger company_watchlists_touch_updated_at
before update on legitbot.company_watchlists
for each row execute function legitbot.touch_updated_at();

create table legitbot.alerts (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references legitbot.members(id) on delete cascade,
  company_id uuid references legitbot.companies(id) on delete cascade,
  company_event_id uuid references legitbot.company_events(id) on delete cascade,
  alert_type text not null check (alert_type in ('critical', 'daily_digest')),
  subject text not null,
  body_ciphertext bytea not null,
  scheduled_for timestamptz not null,
  deduplication_key text not null unique,
  status legitbot.delivery_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index alerts_delivery_queue
  on legitbot.alerts (scheduled_for, created_at)
  where status = 'pending';

create trigger alerts_touch_updated_at
before update on legitbot.alerts
for each row execute function legitbot.touch_updated_at();

create table legitbot.alert_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  alert_id uuid not null references legitbot.alerts(id) on delete cascade,
  channel legitbot.message_channel not null default 'x_dm',
  status legitbot.delivery_status not null default 'pending',
  external_message_id text,
  attempt integer not null default 1 check (attempt > 0),
  attempted_at timestamptz,
  delivered_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  unique (alert_id, channel, attempt)
);

commit;
