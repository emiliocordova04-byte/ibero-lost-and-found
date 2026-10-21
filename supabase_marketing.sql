-- Run this once in the Supabase SQL editor for the ibero-lost-and-found
-- project (Project -> SQL Editor -> New query -> paste -> Run).
-- Same approach as the other tables: no auth in the app yet, so RLS is
-- disabled rather than half-configured.

-- Saved marketing assets (posts, scripts, headlines, landing copy).
create table if not exists marketing_assets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  asset_type text not null,          -- post | script | headline | copy
  title text not null,
  channel text,                      -- LinkedIn | X | Instagram | Email
  day_number integer,                -- calendar day this asset is scheduled for
  body text not null
);

-- A/B test events. One impression and one click per visitor per test.
create table if not exists ab_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  test_key text not null,            -- hero_headline | cta_label
  variant text not null check (variant in ('A', 'B')),
  event text not null check (event in ('impression', 'click')),
  visitor_id text not null
);

create unique index if not exists ab_events_one_per_visitor
  on ab_events (test_key, visitor_id, event);

alter table marketing_assets disable row level security;
alter table ab_events disable row level security;
