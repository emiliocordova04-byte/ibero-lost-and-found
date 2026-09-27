-- Run this once in the Supabase SQL editor for the ibero-lost-and-found
-- project (Project -> SQL Editor -> New query -> paste -> Run).
-- Mirrors how research_entries is set up: no auth in the app yet, so RLS
-- is disabled rather than half-configured.

create table if not exists pricing_scenarios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  scenario_name text not null,
  segment text not null,
  tier text not null,
  students_per_campus integer not null,
  campuses integer not null default 1,
  billing_cycle text not null default 'monthly',
  monthly_revenue numeric not null,
  annual_revenue numeric not null
);

alter table pricing_scenarios disable row level security;
