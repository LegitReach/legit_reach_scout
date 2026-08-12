begin;

create schema if not exists extensions;
create schema if not exists legitbot;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists vector with schema extensions;

comment on schema legitbot is
  'Private application schema for the LegitBot networking and intelligence product.';

create type legitbot.member_status as enum (
  'lead',
  'consented',
  'review_pending',
  'active',
  'paused',
  'blocked',
  'deleted'
);

create type legitbot.consent_kind as enum (
  'service',
  'profile_enrichment',
  'matching',
  'proactive_alerts',
  'email_introductions',
  'marketing',
  'analytics'
);

create type legitbot.consent_status as enum ('granted', 'revoked');
create type legitbot.message_channel as enum ('x_dm', 'email');
create type legitbot.message_direction as enum ('inbound', 'outbound');

create type legitbot.match_state as enum (
  'candidate_ranked',
  'operator_approved',
  'offered_a',
  'accepted_a',
  'offered_b',
  'double_opt_in',
  'emails_verified',
  'introduced',
  'follow_up',
  'outcome_recorded',
  'declined',
  'expired',
  'cancelled'
);

create type legitbot.match_decision as enum (
  'pending',
  'accepted',
  'declined',
  'expired',
  'withdrawn'
);

create type legitbot.introduction_state as enum (
  'awaiting_email_verification',
  'ready',
  'sent',
  'coordinating',
  'follow_up',
  'completed',
  'cancelled'
);

create type legitbot.approval_kind as enum (
  'member_activation',
  'match_proposal',
  'public_post',
  'public_reply',
  'safety_escalation',
  'data_source_license'
);

create type legitbot.approval_status as enum (
  'pending',
  'approved',
  'edited',
  'rejected',
  'expired',
  'cancelled'
);

create type legitbot.job_status as enum (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'cancelled'
);

create type legitbot.plan_code as enum ('free', 'premium', 'elite');

create type legitbot.subscription_status as enum (
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
);

create type legitbot.credit_bucket as enum ('monthly', 'purchased');

create type legitbot.credit_entry_type as enum (
  'grant',
  'debit',
  'refund',
  'expiration',
  'adjustment'
);

create type legitbot.api_key_status as enum ('active', 'revoked');

create type legitbot.source_mode as enum (
  'redistributable',
  'derived_only',
  'catalog_only',
  'blocked'
);

create type legitbot.ingestion_status as enum (
  'queued',
  'running',
  'succeeded',
  'partial',
  'failed',
  'cancelled'
);

create type legitbot.company_status as enum (
  'candidate',
  'review_pending',
  'published',
  'rejected',
  'archived'
);

create type legitbot.alert_cadence as enum (
  'critical_and_daily',
  'critical_only',
  'daily_only',
  'paused'
);

create type legitbot.delivery_status as enum (
  'pending',
  'sent',
  'delivered',
  'failed',
  'suppressed',
  'cancelled'
);

create or replace function legitbot.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function legitbot.reject_x_user_id_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.x_user_id is distinct from new.x_user_id then
    raise exception 'A member X user ID is immutable';
  end if;
  return new;
end;
$$;

commit;
