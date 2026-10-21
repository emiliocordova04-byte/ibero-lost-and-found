# Week 4 Plan: Marketing Engine + Content System

Written and committed BEFORE any Week 4 code (Gate 1 of the course build gates).

## Decisions made by Emilio (inputs to everything below)

- Target persona: the **university administrator** (the person who decides to buy).
- Brand tone: **professional and trustworthy**.
- Language of site and campaign: **English**.
- Visual direction, in his words: bold, eye-catching, professional, interactive and easy to use. The previous dark theme was judged "too AI and ugly" by a professor.

## Problem

The product exists (core extractor, research, pricing simulator) but nothing explains it to the person who would pay for it. The homepage is a dark template with a disabled button and three "coming soon" cards, so a university administrator cannot tell what this is, whether it is credible, or what to do next.

## User

Primary: a university administrator (director of student services, campus security or dean of students) deciding whether to pilot a lost-and-found system. Secondary: the course grader reviewing the evidence.

## Success (must work by end of week)

1. Homepage is a credible product landing page with a working interactive demo and a clear primary call to action.
2. `/marketing` loads live and contains: brand system, target persona, landing page copy, 10 social posts, 3 video scripts, 14-day campaign calendar, A/B headline tester, saved marketing assets.
3. Every content card has copy and export buttons; cards can be saved to Supabase and listed back.
4. Two live A/B tests run on the homepage and their results are visible on `/marketing`.
5. 2 A/B tests + at least 3 software tests, all documented.

## Scope cut (looked nice, not built)

- No real AI generation: all content is hand-written or rule-based, and anything rule-based is labelled as such.
- No email sending or social-network posting: the engine produces and stores the assets, a human publishes them.
- No login: saved assets and A/B events are open to anyone with the link (same as the other tables).
- No paid analytics: A/B tracking is two rows in our own Supabase table.
- No Spanish version of the site.

## Product spec and acceptance criteria

| ID | Feature | Acceptance criteria |
|---|---|---|
| F1 | Upgraded homepage | Hero with A/B headline and CTA; interactive item demo that runs the existing extractor client-side and is labelled simulated; real research numbers pulled from Supabase; tier cards generated from `lib/pricing.mjs`; FAQ accordion; no disabled placeholder buttons. |
| F2 | Site-wide redesign | One light design system (tokens in `globals.css`); every existing page readable and consistent; mobile nav works at 390px width. |
| F3 | Brand system | Colors (with copy-on-click hex), typography, voice rules (do / avoid), logo usage shown on `/marketing`. |
| F4 | Target persona | One persona card: role, goals, frustrations, objections, channels. Labelled as a fictional composite. |
| F5 | Landing page copy | Hero, subhead, 3 benefits, how-it-works, FAQ and CTA text in one source file used by both `/` and `/marketing`. |
| F6 | 10 social posts | Exactly 10, each with channel, hook, body, and a length that fits the channel limit. |
| F7 | 3 video scripts | Exactly 3, each with hook, body beats and CTA, with timings that total 20 to 60 seconds. |
| F8 | 14-day calendar | Exactly 14 days, each day points to a real post or script, with channel and goal. |
| F9 | A/B headline tester | Two live tests (hero headline, CTA label). Stable variant per visitor, one impression and one click counted per visitor per test, results table with rate, lift and p-value, and an honest "not enough data" state. |
| F10 | Copy and export | Copy button on every card; export of the whole kit as Markdown, calendar as CSV, everything as JSON. |
| F11 | Saved assets | Save any card to `marketing_assets`; saved list reloads from Supabase; delete works. |

## Architecture

```
Browser (Next.js App Router, React 19, Tailwind 4)
  /            server component: reads research_entries + TIERS, renders landing
               client islands: HeroHeadline, HeroCta (A/B), ItemDemo, Faq
  /marketing   client page: content from lib/marketingContent.mjs,
               export via lib/exporters.mjs, A/B results via lib/abstats.mjs
        |
        | supabase-js (anon key, NEXT_PUBLIC_* env vars, same as Weeks 1-3)
        v
Supabase (Postgres, RLS off like the other tables)
  marketing_assets(id, created_at, asset_type, title, channel, day_number, body)
  ab_events(id, created_at, test_key, variant, event, visitor_id)
        unique (test_key, visitor_id, event)  -> one impression + one click per visitor
GitHub main -> Vercel auto-deploy (unchanged)
```

Data flow for an A/B test: visitor opens `/` -> visitor id created in localStorage -> variant = hash(visitorId + testKey) mod 2 -> impression row written once -> click on the CTA writes a click row -> `/marketing` reads both counts and runs a two-proportion z-test.

## Tech stack

Next.js 16 + React 19 + Tailwind 4 (already in the repo), Supabase (already wired), Node built-in test runner (`node --test`, already used), `@fontsource-variable` fonts bundled with the app (no network font request, no new service). Free tools only.

## DevOps

Same repo and main-only flow. New SQL file `supabase_marketing.sql` run once in the Supabase SQL editor. No new environment variables. Each push to `main` redeploys on Vercel.

## Test plan

- A/B test 1: hero headline, variant A vs B, metric = click-through on the primary CTA.
- A/B test 2: CTA label, variant A vs B, metric = click-through on the primary CTA.
- Software tests: A/B assignment is deterministic and balanced; the z-test matches hand-computed values; content integrity (10 posts, 3 scripts, 14 days, limits); exporters escape and include every asset; headline scorer rules.
