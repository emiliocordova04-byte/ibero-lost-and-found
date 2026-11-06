# Week 5 Plan: Public Chatbot / Guided Assistant

Written and committed BEFORE any Week 5 code (Gate 1 of the course build gates).

## Decisions made by Emilio (inputs to everything below)

- Audience: the **student** who lost or found an object (a public-facing assistant, not an admin tool).
- Language: the chat understands **English and Spanish**; the documentation and demo are in English.
- Testing: he has **3 external people ready** to use `/chat` for the required user tests.
- Free tools only, no paid AI API. Anything rule-based is labelled as such on the page.

## Problem

A student who loses something on campus does not know where to report it, what to say, or what happens next, and staff receive reports that miss the place or the time. A guided assistant asks the three things staff need, protects the student from sharing private data in a public chat, and tells them honestly what happens next.

## User

Primary: a university student (or staff member) who lost or found an item and wants to report it quickly, on a phone, in English or Spanish. Secondary: the Student Services staff member who reviews reports, and the course grader.

## Success (must work by end of week)

1. `/chat` loads live and shows a chat with a welcome message, quick-reply chips and a visible "rule-based assistant" label.
2. The assistant asks exactly 3 intake questions (what, where, when) and builds a structured report from the answers.
3. Off-topic, unsafe or private-data messages get a clear guardrail response and are never saved in raw form.
4. A human checkpoint exists: the student must confirm the summary, and every report is marked "pending staff review"; the assistant never claims an item was found.
5. Each finished conversation is saved to Supabase, and the student can rate it with thumbs up or down plus an optional comment.
6. 3 external user tests and at least 3 software tests are documented, with at least one bug fixed and redeployed.

## UX concept (wireframes in `docs/week5/`)

- `wireframe-chat.png`: header with the "rule-based assistant, not AI" label, message list, quick-reply chips, input bar, a confirm card ("Is this correct?") and the thumbs rating row.
- `wireframe-results.png`: `/chat/results`, a staff and test summary page with totals, thumbs-up rate, guardrail count and the list of saved reports.

Implementation note: reuse the Week 4 design system (colors, fonts, `card`, `btn-*`, `field`), one primary action per screen, mobile first at 390px.

## Scope cut (looked nice, not built)

- No real AI model or paid API: the assistant is a state machine with keyword rules.
- No login or accounts: sessions are anonymous and open like the other tables.
- No email, SMS or WhatsApp notifications to staff: staff read `/chat/results`.
- No photo upload, no matching of reports to found items.
- No voice input, no streaming "typing" effects.

## Product spec and acceptance criteria

| ID | Feature | Acceptance criteria |
|---|---|---|
| C1 | Chat UI | Message list with student and assistant bubbles, input bar, Enter to send, quick-reply chips, works at 390px, assistant label visible. |
| C2 | Three intake questions | Order is item, place, time. Each answer is checked; an empty or unclear answer gets a gentle re-ask (max 2 re-asks), then the flow continues with "Not provided". |
| C3 | Response logic | Intent rules: greeting, help, restart, talk to a human, yes and no (EN and ES). Extractor from Week 4 fills item, category, color, place and time from the answers. |
| C4 | Guardrail response | Triggers: private data (phone, email, card or ID number), requests for medical or legal advice or homework, prompt-injection phrases, harassment or threats. Response explains what the assistant can do and returns to the intake step. Private data is redacted before saving. |
| C5 | Human checkpoint | Before saving, the assistant shows a summary and asks the student to confirm or fix it. Saved reports have status `pending_staff_review`. Sensitive items (ID card, wallet, phone, keys, documents) are flagged `priority`. The assistant never says an item was found. "Talk to a human" shows the Student Services desk instructions. |
| C6 | Chat and test storage | A confirmed conversation is saved to `chat_sessions` (language, item fields, status, priority, guardrail count, redacted transcript, optional test tag from `?test=`). |
| C7 | Rating | Thumbs up or down with an optional comment (max 300 chars) is saved on the same row; it can be given once. |
| C8 | Results page | `/chat/results` lists saved sessions and shows totals, thumbs-up rate and guardrail count; rows tagged as user tests are marked. |

## Architecture

```
Browser (Next.js App Router, React 19, Tailwind 4)
  /chat            client page: message UI + intake flow
                   lib/chatLogic.mjs   pure functions: nextTurn(state, text) -> {state, replies}
                                       guardrail check, redaction, intent rules, summary builder
                   lib/extractItem.js  Week 4 rule-based extractor (item, color, place, time)
  /chat/results    client page: reads chat_sessions, shows totals and list
        |
        | supabase-js (anon key, NEXT_PUBLIC_* env vars, same as Weeks 1 to 4)
        v
Supabase (Postgres, RLS off like the other tables)
  chat_sessions(id, created_at, lang, item, category, color, place, when_text,
                status, priority, guardrail_hits, rating, feedback, test_tag, transcript jsonb)
GitHub main -> Vercel auto-deploy (unchanged)
```

Data flow: the student types a message; `nextTurn` first runs the guardrail (private data, off-topic, unsafe), then intent rules (restart, human, help), then the current intake step; the reply and the new state come back; at the end the student confirms, the redacted transcript and the structured fields are inserted into `chat_sessions`, and the rating later updates that row.

## Tech stack

Next.js 16 + React 19 + Tailwind 4 (already in the repo), Supabase (already wired), Node built-in test runner (`node --test`, already used). No new packages, no paid services.

## DevOps

Same repo and main-only flow. New SQL file `supabase_chat.sql`, run once in the Supabase SQL editor. No new environment variables. Each push to `main` redeploys on Vercel. Before submission: open `/chat` and check the Supabase project is not paused.

## Test plan

- Software tests: (1) guardrail and redaction rules, (2) intake state machine goes item -> place -> time -> confirm -> done, (3) intent rules in English and Spanish, (4) summary and priority flag, (5) rating validation.
- 3 external user tests: three people who are not the developer each complete the same short script (report a lost item in their own words, ask one off-topic question, rate the chat), and we record time to finish, where they hesitated and a quote. Results are stored in `chat_sessions` with a `test_tag` and written up in the packet.
- Pass rule: at least 2 of 3 testers finish the report without help, and every guardrail trigger gets the guardrail reply.

## Coding agent prompt (implementation prompt, scope as above only)

```
You are the coding agent for Ibero Lost & Found (Next.js 16, Tailwind 4, Supabase, Vercel). Build Week 5: Public Chatbot / Guided Assistant.
Audience: a student who lost or found an item. Language: understands English and Spanish. No paid APIs; rule-based, and say so on the page.
First write and commit a plan, then build in small commits: (1) lib/chatLogic.mjs with tests first, (2) /chat page and message UI, (3) intake flow with 3 questions, (4) guardrail and redaction, (5) human checkpoint and Supabase storage (supabase_chat.sql), (6) thumbs rating, (7) /chat/results.
Never claim an item was found. Redact phone, email and long numbers before saving. Write at least 3 software tests. Push to main, check the Vercel deploy, fix what the tests find, and redeploy. Do not fabricate test results or user feedback.
```
