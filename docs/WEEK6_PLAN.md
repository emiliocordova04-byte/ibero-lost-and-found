# Week 6 Plan: Integrated Agentic Venture + Impact & Viability

Written and committed BEFORE any Week 6 code (Gate 1 of the course build gates). Required live page: `/demo`.

## Decisions made by Emilio (inputs to everything below)

- Deadline: this week, so the full scope below is in, with time for 5 external users and a 5-minute video.
- External users: 5 in total. The 3 testers from Week 5 (T1, T2, T3) count, and 2 new people are already lined up (T4, T5).
- Demo video: 5 minutes, narrated by Emilio with his own voice notes, over a real recording of the live site.
- Extra (no deliverable): a 3 to 5 minute final pitch for class on November 24, prepared after the packet.
- Free tools only, no paid AI API. Anything rule-based or simulated is labelled on the page.

## Problem

The venture site is six separate pages built over six modules. A university buyer (or a grader) opening it cannot tell how the pieces fit, whether they work today, who pays, what each automated agent is allowed to do, where a human decides, and what harm was avoided. A venture that cannot be explained in five minutes with live proof is hard to trust or to buy.

## User

Primary: the university Student Services director or administrator who would buy and use the product, evaluating it in one sitting. Secondary: the student who reports an item, the staff member who reviews reports, and the course grader and class audience on the final pitch. Required testers: 5 external people.

## Success (must work by the end of the week)

1. `/demo` loads live and walks a visitor through six steps (report, review, staff, dashboard, agents, impact), each with live proof and a link to the real page.
2. One navigation on every page reaches every route; no dead links (checked by a test and by a live regression run).
3. `/dashboard` shows live records from Supabase for every module, never showing transcripts or contact data.
4. `/agents` shows the agent map, `/impact` the practical impact and viability check, `/roadmap` the Version 2 roadmap, and `/docs` the prompt library and build log.
5. 5 external users and a full-site regression test are documented, with at least one bug fixed and redeployed.
6. Every simulated or rule-based output says so on the page.

## UX concept (wireframes in `docs/week6/`)

- `wireframe-demo.png`: `/demo`, a six-step progress bar, one step card (what happens, why it matters, live proof, try-it link) and a live numbers column.
- `wireframe-dashboard.png`: `/dashboard`, KPI cards, tabs per module (reports, marketing, pricing, extractions, user tests, testing summary) and a records table with empty and error states.
- `wireframe-agents.png`: `/agents`, a flow diagram of the agents with the human checkpoints drawn differently, and a table of input, output, guardrail and human role per agent.

Implementation note: reuse the existing design system (colors, fonts, `card`, `btn-*`), one primary action per screen, mobile first at 390px, no animation that costs anything.

## Scope cut (looked nice, not built)

- No login or accounts. `/dashboard` and `/chat/results` stay open, so they never show transcripts, emails or phone numbers. Staff login is first on the Version 2 roadmap.
- No real AI model or paid API. The agents are rules, templates and simulators, and say so.
- No payments or billing (no Stripe): `/pricing` stays a simulator.
- No "request a pilot" form, no email or WhatsApp alerts, no photo upload or item matching (Version 2).
- No charts library: bars and tables with plain CSS.

## Product spec and acceptance criteria

| ID | Feature | Acceptance criteria |
|---|---|---|
| V1 | Full navigation | The same header on every page lists Demo, Report an item, Dashboard, Agents, Product, Pricing, Marketing, Research and Docs; the current page is highlighted; the mobile menu opens at 390px; Impact, Roadmap and Staff view are in the footer. A test fails if any nav link has no page. |
| V2 | `/demo` walkthrough | Six steps with a progress bar, Back and Next buttons and arrow-key support. Each step has what happens, why it matters, live proof and a link to the real page. Live numbers (reports, external users) come from Supabase and show a clear message if the database cannot be reached. |
| V3 | `/dashboard` | Loads records from `chat_sessions`, `ab_events`, `marketing_assets`, `pricing_scenarios`, `core_outputs` and `user_tests`. KPI cards for each. Tabs for each module with a table. Empty state, error state with Retry, and a Refresh button. No transcript, feedback text or contact data is displayed. |
| V4 | Agent map | At least 5 agents. Each shows input, output, data store, guardrail, whether it is rule-based or simulated, and the human checkpoint. The diagram shows the human steps differently from the automated ones. |
| V5 | Testing summary | A table of the 5 external users (finished alone, minutes, rating, one quote) read from `user_tests`, the computed pass rule (at least 4 of 5 finish alone), and the regression results by route. |
| V6 | Practical impact and viability check | Impact: median minutes to report with the chat, against the minutes the same testers say it takes today, computed from `user_tests`. Harm check: at least 6 risks, each with a mitigation and a status (done or open). Viability: break-even customers per tier from the simulated prices and stated costs, with every assumption labelled. |
| V7 | Version 2 roadmap | At least 6 items, each with the problem it solves, effort (1 to 3), impact (1 to 5) and a score impact divided by effort; sorted by score; the first item is staff login. |
| V8 | `/docs` | Keeps the existing documentation, adds a prompt library (the macro-prompt pattern and the prompt used each module) and a build log with commits per module taken from the git history. |
| V9 | Labels | Every page that shows simulated, rule-based or illustrative numbers says so next to them. |
| V10 | Full-site regression | `scripts/regression.mjs` requests every route of the live site and checks status 200 and one expected text per route; all routes pass before submission. |

## Architecture

```
Browser (Next.js App Router, React 19, Tailwind 4)
  /demo        client page: step state, live counts
  /dashboard   client page: reads 6 tables, tabs, refresh
  /agents  /impact  /roadmap   mostly static pages built from lib/ventureData.mjs
  /docs        static: prompt library + build log (lib/ventureData.mjs)
  Nav + footer in app/layout.js (single list in lib/venture.mjs, used by Nav and by the nav test)

lib/venture.mjs      pure functions: NAV_LINKS, summarizeDashboard(rows), sanitizeRow(row),
                     medianMinutes(tests), passRule(tests), rankRoadmap(items), breakEven(tier, cost)
lib/ventureData.mjs  agents, harms, roadmap items, prompt library, build log (static data)
        |
        | supabase-js (anon key, NEXT_PUBLIC_* env vars, same as Weeks 1 to 5)
        v
Supabase (Postgres, RLS off like the other tables)
  existing: chat_sessions, core_outputs, marketing_assets, ab_events, pricing_scenarios
  new:      user_tests(id, created_at, tester_tag, finished_alone, minutes, baseline_minutes,
                       trust_1_5, quote, found_bug, route_tested)
GitHub main -> Vercel auto-deploy (unchanged)
```

Data flow: the dashboard asks Supabase for the latest rows of each table (limited columns, no transcripts), `sanitizeRow` drops anything private, `summarizeDashboard` builds the counts, and the page renders KPI cards and tables. The impact page reads `user_tests` and computes the medians; if the table is empty it says so instead of inventing numbers.

## Tech stack

Next.js 16 + React 19 + Tailwind 4, Supabase and the Node built-in test runner (`node --test`), all already in the repo. One small Node script (`scripts/regression.mjs`, built-in `fetch`) for the live regression. No new packages, no paid services.

## DevOps

Same repo and main-only flow. New SQL file `supabase_user_tests.sql`, run once in the Supabase SQL editor. No new environment variables. Each push to `main` redeploys on Vercel. Before submission: run the regression against the live URL and check the Supabase project is not paused.

## Test plan

- Software tests (at least 3, planned 8): (1) every nav link has a page file, (2) `summarizeDashboard` with empty, normal and odd rows, (3) `sanitizeRow` removes transcript, feedback and contact fields, (4) `medianMinutes` and `passRule`, (5) `rankRoadmap` order and tie-break, (6) `breakEven` per tier, (7) agent data completeness (every agent has input, output, guardrail, human checkpoint), (8) the build log commit counts add up to the git history.
- Full-site regression: `scripts/regression.mjs` against the live URL for all routes, plus a manual pass of the six demo steps on a phone-sized window.
- 5 external users (T1 to T3 from Week 5, T4 and T5 new): each completes the same short script on the whole site (report an item in their own words, open `/demo` and say what the product is for, find one number on `/dashboard`) and answers closed questions, including how long it takes them to report a lost item today. We record finished alone, minutes, trust and a quote, in `user_tests`.
- Pass rule: at least 4 of 5 finish without help, every route in the regression returns 200, and any bug found is fixed and redeployed.

## Coding agent prompt (implementation prompt, scope as above only)

```
You are the coding agent for Ibero Lost & Found (Next.js 16, Tailwind 4, Supabase, Vercel). Build Week 6: Integrated Agentic Venture + Impact & Viability. Required live page: /demo.
Audience: a university Student Services director evaluating the product; also a grader. No paid APIs. Everything simulated or rule-based must be labelled.
Read docs/WEEK6_PLAN.md first and build only that scope, in small commits, tests first: (1) lib/venture.mjs and lib/ventureData.mjs with tests, (2) one navigation list used by the header and footer, (3) /dashboard reading Supabase with empty and error states and no private fields, (4) /agents, (5) /demo with six steps, (6) /impact and /roadmap, (7) /docs prompt library and build log, (8) supabase_user_tests.sql and scripts/regression.mjs.
Never show transcripts, feedback text, emails or phone numbers on any public page. Do not fabricate user data, test results or impact numbers: read them from the database or show an empty state. Push to main, check each Vercel deploy, fix what the tests and the regression find, and redeploy.
```
