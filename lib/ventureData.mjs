// Week 6: static content for /agents, /impact, /roadmap and /docs.
// Nothing here is invented user data: harms and roadmap are design decisions,
// build-log commit counts come from the git history of this repo.

export const AGENTS = [
  {
    id: "intake", name: "Intake assistant", route: "/chat", kind: "rule-based",
    input: "A student's free text in English or Spanish",
    output: "A confirmed report (item, place, time) saved as pending staff review",
    store: "chat_sessions",
    guardrail: "Removes phone, email and ID numbers before saving; off-topic and unsafe messages get a safety reply; never says an item was found",
    human: "The student confirms the summary, and staff review every report",
  },
  {
    id: "extractor", name: "Item extractor", route: "/core", kind: "simulated",
    input: "A free-text description of an item",
    output: "Item, category, color, place and date fields",
    store: "core_outputs",
    guardrail: "Says Not detected instead of guessing; every result carries a SIMULATED badge",
    human: "The user reads the fields and can clear or save them",
  },
  {
    id: "marketing", name: "Marketing engine", route: "/marketing", kind: "template",
    input: "Brand, persona and channel choices",
    output: "Posts, scripts, headlines, a calendar and two live A/B tests",
    store: "marketing_assets, ab_events",
    guardrail: "Templates only, no invented customer claims; A/B results need a minimum sample before a winner is shown",
    human: "Emilio reviews and publishes the content himself",
  },
  {
    id: "pricing", name: "Pricing simulator", route: "/pricing", kind: "simulated",
    input: "Students per campus, campuses, ownership and billing cycle",
    output: "Tier, monthly and annual revenue",
    store: "pricing_scenarios",
    guardrail: "All prices are labelled simulated, not real quotes",
    human: "A university buyer decides whether the price makes sense",
  },
  {
    id: "staff", name: "Staff reviewer", route: "/chat/results", kind: "human",
    input: "Every saved report, with a Priority flag for sensitive items",
    output: "A status: found, returned or closed (nothing is deleted)",
    store: "chat_sessions.status",
    guardrail: "Demo view without login, so it never shows contact data; login is first on the Version 2 roadmap",
    human: "This step is the human checkpoint",
  },
  {
    id: "coding", name: "Coding agent (Claude)", route: "/docs", kind: "ai-assisted",
    input: "The weekly plan and acceptance criteria written first",
    output: "Code, tests, commits and deployments",
    store: "GitHub and Vercel",
    guardrail: "Plan before code, failing test before fix, every deploy checked live",
    human: "Emilio chooses scope, reviews each change and decides what is rejected",
  },
];

export const HARMS = [
  { risk: "A student types a phone number, email or ID number into the chat", mitigation: "The chat removes them before anything is saved and replies with a safety message; a software test covers the phone format that first slipped through", status: "done" },
  { risk: "The assistant promises that a lost item was found", mitigation: "The chat never says found; every report is saved as pending staff review and a person checks it", status: "done" },
  { risk: "Public pages expose private conversation data", mitigation: "The dashboard never loads transcripts, comments or contact fields, and a test checks that they are stripped", status: "done" },
  { risk: "Someone presents simulated AI or prices as real", mitigation: "Rule-based and simulated outputs carry a label on the page where they appear", status: "done" },
  { risk: "The database is unreachable when a visitor opens the site", mitigation: "Pages show a clear message with a Retry button instead of a blank screen", status: "done" },
  { risk: "Anyone with the staff link can change a report's status", mitigation: "The page says it is a demo without login; Supabase Auth is first on the Version 2 roadmap", status: "open" },
  { risk: "The database has no Row Level Security, so anyone with the public key could write to it", mitigation: "Chosen on purpose for a course demo with test data only; policies come with login in Version 2", status: "open" },
  { risk: "Students who write in another language are left out", mitigation: "English and Spanish are covered; other languages and an accessibility audit are on the roadmap", status: "open" },
];

export const ROADMAP = [
  { id: "auth", title: "Staff login", problem: "Anyone with the link can change a status", impact: 5, effort: 2 },
  { id: "rls", title: "Row Level Security policies", problem: "The database accepts writes from anyone with the public key", impact: 4, effort: 2 },
  { id: "photos", title: "Photo upload on reports", problem: "Staff cannot see the item, so matching is slow", impact: 4, effort: 2 },
  { id: "notify", title: "Email or WhatsApp alert when the status changes", problem: "Students must come back to the site to check", impact: 4, effort: 2 },
  { id: "match", title: "Match lost reports with found items", problem: "Staff compare reports by hand", impact: 5, effort: 3 },
  { id: "multi", title: "Multi-campus accounts", problem: "Larger buyers need one account for several campuses", impact: 4, effort: 3 },
  { id: "lang", title: "More languages and an accessibility audit", problem: "Some students cannot use the chat comfortably", impact: 3, effort: 2 },
  { id: "analytics", title: "Staff analytics (time to return, repeat places)", problem: "Staff cannot see where items are lost most", impact: 2, effort: 2 },
  { id: "ai", title: "A real AI model with human review", problem: "Rules miss unusual descriptions; costs and risks must be measured first", impact: 3, effort: 3 },
];

// Commits per module, counted from this repository's git history (git log, by date).
export const BUILD_LOG = [
  { id: "setup", label: "Setup", dates: "Aug 20 to 21", route: "/", commits: 6, shipped: "Next.js scaffold, Supabase connection, docs page, README" },
  { id: "core", label: "Core agent", dates: "Sep 1 to 11", route: "/core", commits: 8, shipped: "Item description extractor (simulated AI) with saved results" },
  { id: "research", label: "Market research", dates: "Sep 23 to 26", route: "/research", commits: 6, shipped: "Competitor table, benchmark cards, risk map, accessibility fixes" },
  { id: "pricing", label: "Product and pricing", dates: "Sep 27", route: "/pricing", commits: 9, shipped: "Product tiers, revenue simulator, saved scenarios, pricing tests" },
  { id: "marketing", label: "Marketing engine (Week 4)", dates: "Oct 21 to Nov 6", route: "/marketing", commits: 11, shipped: "Landing page, content generator, two live A/B tests, design system" },
  { id: "chat", label: "Public chatbot (Week 5)", dates: "Nov 6 to 7", route: "/chat", commits: 21, shipped: "Guided assistant, guardrails, staff view, ratings, 45 tests" },
];

export const PROMPT_LIBRARY = [
  { id: "macro", title: "Macro-prompt pattern (every week)", when: "Start of each module, before any code", text: "ROLE: You are my disciplined AI-native product architect and coding partner.\nCOURSE RULE: Do not let me code before the plan is clear.\nTASK: Help me complete this week's Build Discipline Packet, then create a precise implementation prompt for Codex or Claude Code.\nCONSTRAINTS: Free tools only. Next.js/React + Tailwind + Vercel + GitHub + Supabase when data is needed. Build small, testable features. No paid APIs required; if AI output is simulated, label it clearly. Require acceptance criteria before coding." },
  { id: "w6addon", title: "Week 6 add-on", when: "Week 6 planning", text: "THIS WEEK: Integrated Agentic Venture + Impact & Viability. REQUIRED LIVE PAGE: /demo. Build: full navigation, /dashboard with records, /docs with prompt library and build logs, /demo guided walkthrough, agent map, 5 external users, practical impact check, Version 2 roadmap. Before giving me code, force me to complete the Build Discipline Packet." },
  { id: "w5impl", title: "Week 5 implementation prompt", when: "Public chatbot", text: "Build Week 5: Public Chatbot / Guided Assistant. Audience: a student who lost or found an item; English and Spanish; rule-based and say so on the page. Commit a plan first, then small commits with tests first. Never claim an item was found. Redact phone, email and long numbers before saving. Do not fabricate test results or user feedback." },
  { id: "w6impl", title: "Week 6 implementation prompt", when: "This integration week", text: "Build Week 6 from docs/WEEK6_PLAN.md only: lib/venture.mjs with tests first, one navigation list, /dashboard (no private fields), /agents, /demo, /impact, /roadmap, /docs prompt library and build log, supabase_user_tests.sql, scripts/regression.mjs. Do not fabricate user data or impact numbers: read them from the database or show an empty state." },
  { id: "bugfix", title: "Failing test first, then fix", when: "A bug found on the live site", text: "Reproduce this bug with a failing test and commit it. Then make the smallest change that passes it, run every test, push, wait for the Vercel deployment and check the live page again. Say what you checked." },
  { id: "predeploy", title: "Review before deploy", when: "Before each push to main", text: "Review the diff for: private data shown on a page, claims that are not true, simulated output without a label, links that do not exist, and states for empty and error. List problems before fixing any." },
  { id: "usertest", title: "User test script", when: "Each external tester", text: "Write a short script a friend can follow alone in five minutes, with closed answers only: finished alone yes or no, minutes, how long it takes today, trust from 1 to 5, and one quote. Do not suggest answers." },
  { id: "note", title: "Human decision note", when: "End of each week", text: "From the decisions I made this week, draft 150 to 250 words in first person on what I chose, rejected and corrected, and the tradeoffs. I will edit it so it is in my own words." },
];
