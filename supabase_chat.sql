-- Run this once in the Supabase SQL editor for the ibero-lost-and-found
-- project (Project -> SQL Editor -> New query -> paste -> Run).
-- Same approach as the other tables: no auth in the app yet, so RLS is
-- disabled rather than half-configured.

-- One row per confirmed chat report. Transcripts are stored with phone
-- numbers, emails and long numbers already removed in the browser.
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lang text not null default 'en',                 -- en | es
  item text,
  category text,
  color text,
  place text,
  when_text text,
  status text not null default 'pending_staff_review',
  priority boolean not null default false,         -- sensitive item, staff look first
  guardrail_hits integer not null default 0,
  rating text check (rating in ('up', 'down')),    -- thumbs up / down
  feedback text,                                   -- optional comment, max 300 chars
  test_tag text,                                   -- set from /chat?test=T1 for user tests
  transcript jsonb not null default '[]'::jsonb
);

alter table chat_sessions disable row level security;
