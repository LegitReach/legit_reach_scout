begin;

do $$
declare
  relation record;
begin
  for relation in
    select tablename
    from pg_catalog.pg_tables
    where schemaname = 'legitbot'
  loop
    execute format('alter table legitbot.%I enable row level security', relation.tablename);
  end loop;
end;
$$;

revoke all on schema legitbot from public, anon;
revoke all on all tables in schema legitbot from public, anon, authenticated;
revoke all on all functions in schema legitbot from public, anon, authenticated;

grant usage on schema legitbot to authenticated, service_role;
grant all on all tables in schema legitbot to service_role;
grant execute on all functions in schema legitbot to service_role;
grant execute on function legitbot.current_member_id() to authenticated;

alter default privileges in schema legitbot
  revoke all on tables from public, anon, authenticated;
alter default privileges in schema legitbot
  grant all on tables to service_role;
alter default privileges in schema legitbot
  revoke execute on functions from public, anon, authenticated;
alter default privileges in schema legitbot
  grant execute on functions to service_role;

create or replace function legitbot.is_match_participant(candidate_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from legitbot.matches as match
    where match.id = candidate_match_id
      and legitbot.current_member_id() in (match.member_a_id, match.member_b_id)
  )
$$;

create or replace function legitbot.is_introduction_participant(candidate_introduction_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from legitbot.introduction_participants as participant
    where participant.introduction_id = candidate_introduction_id
      and participant.member_id = legitbot.current_member_id()
  )
$$;

create or replace function legitbot.owns_alert_delivery(candidate_alert_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from legitbot.alerts as alert
    where alert.id = candidate_alert_id
      and alert.member_id = legitbot.current_member_id()
  )
$$;

revoke all on function legitbot.is_match_participant(uuid) from public;
revoke all on function legitbot.is_introduction_participant(uuid) from public;
revoke all on function legitbot.owns_alert_delivery(uuid) from public;
grant execute on function legitbot.is_match_participant(uuid) to authenticated;
grant execute on function legitbot.is_introduction_participant(uuid) to authenticated;
grant execute on function legitbot.owns_alert_delivery(uuid) to authenticated;

grant select, update on legitbot.members to authenticated;
create policy members_select_own
  on legitbot.members for select to authenticated
  using (id = legitbot.current_member_id());
create policy members_update_own
  on legitbot.members for update to authenticated
  using (id = legitbot.current_member_id())
  with check (id = legitbot.current_member_id());

grant select on legitbot.consent_events to authenticated;
grant select on legitbot.current_consents to authenticated;
create policy consent_events_select_own
  on legitbot.consent_events for select to authenticated
  using (member_id = legitbot.current_member_id());

grant select, update on legitbot.member_profiles to authenticated;
create policy member_profiles_select_own
  on legitbot.member_profiles for select to authenticated
  using (member_id = legitbot.current_member_id());
create policy member_profiles_update_own
  on legitbot.member_profiles for update to authenticated
  using (member_id = legitbot.current_member_id())
  with check (member_id = legitbot.current_member_id());

grant select on legitbot.profile_enrichment_items to authenticated;
create policy profile_enrichment_items_select_own
  on legitbot.profile_enrichment_items for select to authenticated
  using (member_id = legitbot.current_member_id());

grant select, insert, delete on legitbot.member_blocks to authenticated;
create policy member_blocks_select_own
  on legitbot.member_blocks for select to authenticated
  using (blocker_member_id = legitbot.current_member_id());
create policy member_blocks_insert_own
  on legitbot.member_blocks for insert to authenticated
  with check (blocker_member_id = legitbot.current_member_id());
create policy member_blocks_delete_own
  on legitbot.member_blocks for delete to authenticated
  using (blocker_member_id = legitbot.current_member_id());

grant select on legitbot.matches, legitbot.match_offers to authenticated;
create policy matches_select_participant
  on legitbot.matches for select to authenticated
  using (legitbot.current_member_id() in (member_a_id, member_b_id));
create policy match_offers_select_own
  on legitbot.match_offers for select to authenticated
  using (member_id = legitbot.current_member_id());

grant select on legitbot.introductions, legitbot.introduction_participants to authenticated;
create policy introductions_select_participant
  on legitbot.introductions for select to authenticated
  using (legitbot.is_introduction_participant(id));
create policy introduction_participants_select_peer
  on legitbot.introduction_participants for select to authenticated
  using (legitbot.is_introduction_participant(introduction_id));

grant select on legitbot.plan_entitlements to authenticated;
create policy plan_entitlements_select_all
  on legitbot.plan_entitlements for select to authenticated
  using (true);

grant select on legitbot.subscriptions to authenticated;
create policy subscriptions_select_own
  on legitbot.subscriptions for select to authenticated
  using (member_id = legitbot.current_member_id());

grant select on legitbot.monthly_entitlement_usage to authenticated;
create policy monthly_entitlement_usage_select_own
  on legitbot.monthly_entitlement_usage for select to authenticated
  using (member_id = legitbot.current_member_id());

grant select on legitbot.credit_grants, legitbot.credit_ledger, legitbot.api_usage_events to authenticated;
create policy credit_grants_select_own
  on legitbot.credit_grants for select to authenticated
  using (member_id = legitbot.current_member_id());
create policy credit_ledger_select_own
  on legitbot.credit_ledger for select to authenticated
  using (member_id = legitbot.current_member_id());
create policy api_usage_events_select_own
  on legitbot.api_usage_events for select to authenticated
  using (member_id = legitbot.current_member_id());

grant select (
  id,
  member_id,
  key_prefix,
  key_last_four,
  label,
  scopes,
  status,
  last_used_at,
  expires_at,
  revoked_at,
  created_at
) on legitbot.api_keys to authenticated;
create policy api_keys_select_own
  on legitbot.api_keys for select to authenticated
  using (member_id = legitbot.current_member_id());

grant select on legitbot.sources, legitbot.source_reviews, legitbot.datasets to authenticated;
create policy sources_select_nonblocked
  on legitbot.sources for select to authenticated
  using (mode <> 'blocked');
create policy source_reviews_select_nonblocked
  on legitbot.source_reviews for select to authenticated
  using (
    exists (
      select 1 from legitbot.sources as source
      where source.id = source_id and source.mode <> 'blocked'
    )
  );
create policy datasets_select_enabled
  on legitbot.datasets for select to authenticated
  using (enabled and mode <> 'blocked');

grant select on legitbot.dataset_records to authenticated;
create policy dataset_records_select_redistributable
  on legitbot.dataset_records for select to authenticated
  using (
    source_mode_at_retrieval = 'redistributable'
    and exists (
      select 1
      from legitbot.datasets as dataset
      join legitbot.sources as source on source.id = dataset.source_id
      where dataset.id = dataset_id
        and dataset.enabled
        and dataset.mode = 'redistributable'
        and source.mode = 'redistributable'
    )
  );

grant select on legitbot.companies, legitbot.company_events to authenticated;
create policy companies_select_published
  on legitbot.companies for select to authenticated
  using (status = 'published');
create policy company_events_select_published
  on legitbot.company_events for select to authenticated
  using (
    publication_status = 'published'
    and exists (
      select 1 from legitbot.companies as company
      where company.id = company_id and company.status = 'published'
    )
    and exists (
      select 1 from legitbot.sources as source
      where source.id = source_id and source.mode in ('redistributable', 'derived_only')
    )
  );

grant select on legitbot.launches, legitbot.space_weather_events to authenticated;
create policy launches_select_published
  on legitbot.launches for select to authenticated
  using (
    publication_status = 'published'
    and exists (
      select 1 from legitbot.sources as source
      where source.id = source_id and source.mode in ('redistributable', 'derived_only')
    )
  );
create policy space_weather_events_select_published
  on legitbot.space_weather_events for select to authenticated
  using (
    publication_status = 'published'
    and exists (
      select 1 from legitbot.sources as source
      where source.id = source_id and source.mode in ('redistributable', 'derived_only')
    )
  );

grant select, insert, update, delete on legitbot.company_watchlists to authenticated;
create policy company_watchlists_select_own
  on legitbot.company_watchlists for select to authenticated
  using (member_id = legitbot.current_member_id());
create policy company_watchlists_insert_own
  on legitbot.company_watchlists for insert to authenticated
  with check (member_id = legitbot.current_member_id());
create policy company_watchlists_update_own
  on legitbot.company_watchlists for update to authenticated
  using (member_id = legitbot.current_member_id())
  with check (member_id = legitbot.current_member_id());
create policy company_watchlists_delete_own
  on legitbot.company_watchlists for delete to authenticated
  using (member_id = legitbot.current_member_id());

grant select on legitbot.alerts, legitbot.alert_deliveries to authenticated;
create policy alerts_select_own
  on legitbot.alerts for select to authenticated
  using (member_id = legitbot.current_member_id());
create policy alert_deliveries_select_own
  on legitbot.alert_deliveries for select to authenticated
  using (legitbot.owns_alert_delivery(alert_id));

commit;
