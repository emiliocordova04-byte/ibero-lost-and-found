// Single source of truth for all Week 4 marketing content.
// The homepage and /marketing both read from here, so the landing page the
// visitor sees and the copy documented in the marketing engine can never drift.
//
// Decisions that came from Emilio (Week 4 brief): the target persona is the
// university administrator, the tone is professional and trustworthy, and the
// language is English. Everything below is hand-written, not AI-generated at
// runtime, and nothing here claims customers, results or testimonials that do
// not exist: the product is a working prototype with a pilot planned.

export const PRODUCT_STATUS = {
  live: [
    "Item description extractor (rule-based, English and Spanish)",
    "Market research and benchmarking dashboard",
    "Pricing simulator for any campus size",
    "Marketing engine with saved assets and live A/B tests",
  ],
  planned: [
    "Student reporting and browsing app",
    "Search, filters and mark-as-recovered",
    "Administrator dashboard and CSV reports",
  ],
};

// ---------------------------------------------------------------- brand ----

export const BRAND = {
  name: "Ibero Lost & Found",
  tagline: "Every lost item, accounted for.",
  mission:
    "Give every university a lost-and-found it can actually run: one searchable record, one clear process, and a way to prove it works.",
  colors: [
    { name: "Ink", hex: "#0F1B2D", role: "Text, headlines, dark sections" },
    { name: "Paper", hex: "#F7F2E8", role: "Page background, warm and calm" },
    { name: "Signal Red", hex: "#D8281E", role: "Primary actions and the logo" },
    { name: "Navy", hex: "#0E2A47", role: "Trust sections, charts, secondary" },
    { name: "Sun", hex: "#FFC93C", role: "Highlights and small accents only" },
    { name: "Ledger Green", hex: "#14795F", role: "Success and recovered items" },
  ],
  typography: [
    {
      role: "Display",
      family: "Bricolage Grotesque",
      sample: "Get lost items home faster",
      usage: "Headlines and numbers. Tight tracking, bold weight.",
    },
    {
      role: "Body",
      family: "DM Sans",
      sample: "One searchable record for every item found on campus.",
      usage: "Paragraphs, forms and interface text.",
    },
  ],
  voice: {
    principles: [
      "Professional and trustworthy: plain facts, calm confidence.",
      "Specific over impressive: name the process, not the hype.",
      "Honest about status: say what works today and what is planned.",
    ],
    do: [
      "Write for the person who decides: a director who needs fewer complaints and an audit trail.",
      "Lead with the outcome (items returned) before the feature.",
      "Label simulated or rule-based output as such.",
    ],
    avoid: [
      "Invented statistics, customers or testimonials.",
      "Buzzwords such as revolutionary, AI-powered magic or game-changing.",
      "Exclamation marks and emoji in professional channels.",
    ],
  },
  logoRules: [
    "Use the red tag mark with the wordmark. Keep clear space equal to the mark's height on every side.",
    "On dark backgrounds use the white wordmark with the same red mark.",
    "Never stretch, outline or place the mark on a busy photo.",
  ],
};

// -------------------------------------------------------------- persona ----

export const PERSONA = {
  label: "Fictional composite persona, built from the Week 2 market research",
  name: "Mariana Reyes",
  role: "Director of Student Services",
  org: "Mid-size private university, Mexico City",
  quote: "I don't need another app. I need to know that when a student loses something, there is a process and a record.",
  goals: [
    "Fewer complaints about lost belongings reaching her office.",
    "One record of every item, who found it and who collected it.",
    "A tool her team can run without training or IT tickets.",
    "A clear price she can take to procurement.",
  ],
  frustrations: [
    "Items sit in a drawer or a WhatsApp group with no log.",
    "Staff spend time answering the same where-is-my-item questions.",
    "No way to show leadership how many items were actually returned.",
  ],
  objections: [
    "Budget: the price has to be predictable and justified.",
    "Student data: she needs to trust how personal information is handled.",
    "Adoption: another system only matters if students and staff use it.",
  ],
  channels: [
    "LinkedIn (primary)",
    "Higher-ed association events and newsletters",
    "Peer recommendations from other universities",
    "Short demo video sent by email",
  ],
};

// -------------------------------------------------------- landing copy -----

// The two live A/B tests. Visitors get one variant per test, assigned by
// hashing their anonymous id (see lib/ab.mjs).
export const AB_TESTS = [
  {
    key: "hero_headline",
    name: "Hero headline",
    question: "Which headline gets more administrators to click the main button?",
    metric: "Click-through on the primary call to action",
    variants: {
      A: "Get lost items back to their owners, faster.",
      B: "One system for every lost item on your campus.",
    },
  },
  {
    key: "cta_label",
    name: "Call to action label",
    question: "Which button label gets more clicks?",
    metric: "Click-through on the primary call to action",
    variants: {
      A: "See pricing for your campus",
      B: "Plan my campus pilot",
    },
  },
];

export function getTest(key) {
  return AB_TESTS.find((t) => t.key === key);
}

export const LANDING_COPY = {
  eyebrow: "For university student-services teams",
  subhead:
    "Ibero Lost & Found gives your campus one searchable record for every item reported or found, so your team spends less time answering where-is-my-item questions and can show what was actually returned.",
  secondaryCta: "Try the live demo",
  statusNote: "Working prototype. Pilot planned. No customer claims.",
  problemTitle: "Lost and found is a process problem, not an app problem",
  problems: [
    {
      title: "No single record",
      body: "Items live in a drawer, a security desk and a group chat. Nobody can say what was found, when, or by whom.",
    },
    {
      title: "Staff time disappears",
      body: "The same where-is-my-item question reaches three offices, and each one starts from zero.",
    },
    {
      title: "Nothing to show leadership",
      body: "Without a log there is no return rate, no trend and no answer when a complaint escalates.",
    },
  ],
  stepsTitle: "How it works",
  steps: [
    {
      title: "Describe the item",
      body: "A student or staff member writes it in plain English or Spanish. The system pulls out the item, color, place and date.",
    },
    {
      title: "Match and notify",
      body: "Reports and found items sit in one record, so your team can search, match and notify the owner.",
    },
    {
      title: "Close the loop",
      body: "Mark the item recovered. The record shows what was returned, and when.",
    },
  ],
  featuresTitle: "Built for the person who runs the process",
  features: [
    { title: "One record per item", body: "Every report and every found item in a single searchable list.", status: "Live as a demo" },
    { title: "Plain-language intake", body: "Free text in English or Spanish becomes structured fields.", status: "Live as a demo" },
    { title: "Pricing by campus size", body: "A flat monthly price per campus, with a private-university premium and an annual discount.", status: "Live" },
    { title: "Search and filters", body: "Find items by category, color, place or status.", status: "Planned" },
    { title: "Recovery reporting", body: "See how many items were returned and how fast.", status: "Planned" },
    { title: "CSV export", body: "Take your records into the tools you already use.", status: "Planned" },
  ],
  faqTitle: "Questions an administrator will ask",
  faq: [
    {
      q: "Is this a finished product?",
      a: "No. It is a working prototype built as a university course project. The item extractor, the market research dashboard, the pricing simulator and this marketing engine run today. The student app and the administrator dashboard are planned for a pilot.",
    },
    {
      q: "How is it priced?",
      a: "A flat monthly price per campus based on student count, from $199 for small campuses to $999 for large ones. Private universities pay a 15% premium and annual billing takes 25% off. All figures come from our pricing simulator and are simulated, not real quotes.",
    },
    {
      q: "Does it use AI?",
      a: "The item description demo uses simple keyword rules, not a language model, and labels every result as simulated. We do not need a paid AI service to run the core process.",
    },
    {
      q: "What about student data?",
      a: "The prototype stores only the text a user submits and has no accounts. A pilot would add authentication, retention rules and a data-handling agreement before any real student information is stored.",
    },
    {
      q: "What would a pilot look like?",
      a: "One campus, one semester, a small team running the process, and a simple measure of items reported versus items returned.",
    },
  ],
  finalTitle: "See what it would cost your campus",
  finalBody: "Enter your student count and number of campuses. The simulator returns a monthly and annual price in seconds.",
};

// -------------------------------------------------------- social posts -----

export const CHANNEL_LIMITS = { LinkedIn: 3000, X: 280, Instagram: 2200 };

export const POSTS = [
  {
    id: "post-01",
    channel: "LinkedIn",
    angle: "Problem",
    hook: "Where does a lost laptop go on your campus?",
    body: "Where does a lost laptop go on your campus?\n\nOn many campuses the honest answer is a drawer, a security desk or a group chat. There is no single record, so every request starts from zero.\n\nWe have been mapping how universities and software tools handle lost items. The gap is clear: very few options are both digital and built for a campus.\n\nHow does your team track found items today?",
  },
  {
    id: "post-02",
    channel: "X",
    angle: "Problem",
    hook: "Lost and found is a process problem.",
    body: "Lost and found is not an app problem. It is a process problem.\n\nOne record. One owner for every item. One way to show what was returned.",
  },
  {
    id: "post-03",
    channel: "LinkedIn",
    angle: "Education",
    hook: "Three questions to audit your lost and found",
    body: "Three questions to audit your campus lost and found in five minutes:\n\n1. Can anyone on your team see every item currently held?\n2. Do you know how many items were returned last semester?\n3. If a student complains, can you show the record?\n\nIf the answer to any of these is no, you do not have a lost and found. You have a drawer.\n\nWe are building a simple system to fix that. Follow along.",
  },
  {
    id: "post-04",
    channel: "Instagram",
    angle: "Awareness",
    hook: "Lost something on campus?",
    body: "Lost something on campus?\n\nYour university can make it easy to get it back. One record, one search, one answer.\n\nWe are building Ibero Lost & Found for campuses that want a real process.\n\n#highereducation #campuslife #studentservices #lostandfound",
  },
  {
    id: "post-05",
    channel: "LinkedIn",
    angle: "Product",
    hook: "Describe it in plain words. Get structured data.",
    body: "Describe a lost item the way you would say it:\n\n\"Black backpack, left in the library yesterday.\"\n\nOur demo turns that sentence into an item, a color, a place and a date, in English or Spanish. It uses simple keyword rules, not a language model, and every result is labelled as simulated.\n\nWhy it matters: structured records are what make search, matching and reporting possible.\n\nTry it on the site, no sign-up needed.",
  },
  {
    id: "post-06",
    channel: "X",
    angle: "Product",
    hook: "Try the live item demo",
    body: "Type \"black backpack, library, yesterday\".\n\nGet item, color, place and date back as a structured record. English or Spanish. Rule-based, labelled simulated.\n\nTry it, no sign-up.",
  },
  {
    id: "post-07",
    channel: "LinkedIn",
    angle: "Pricing",
    hook: "A price you can take to procurement",
    body: "Procurement asks one question first: what does it cost?\n\nSo we publish the model. A flat monthly price per campus based on student count. Private universities pay a 15% premium. Annual billing takes 25% off.\n\nYou can put your own numbers into the simulator and see a monthly and annual figure in seconds. These are simulated prices for a prototype, not a quote.",
  },
  {
    id: "post-08",
    channel: "Instagram",
    angle: "Behind the scenes",
    hook: "Built by a student, tested in public",
    body: "This product is a student project, and we test it in public.\n\nThis week we are running two live A/B tests on our homepage: one on the headline and one on the button. The results are visible on our marketing page, even when they are inconclusive.\n\nBuilding in the open keeps us honest.\n\n#buildinpublic #studentbuilder #highereducation",
  },
  {
    id: "post-09",
    channel: "LinkedIn",
    angle: "Proof",
    hook: "What a pilot would measure",
    body: "If we ran a pilot at your campus, here is what we would measure:\n\n- Items reported versus items found\n- Items returned to their owner\n- Time between report and return\n- Questions your team no longer has to answer by hand\n\nOne campus, one semester, one simple report. No lock-in.\n\nIf you run student services and want to see the plan, the pricing simulator is the place to start.",
  },
  {
    id: "post-10",
    channel: "X",
    angle: "Conversion",
    hook: "See what it would cost your campus",
    body: "Running student services?\n\nEnter your student count and number of campuses. Get a monthly and annual price in seconds.\n\nSimulated pricing, no sales call.",
  },
];

// ------------------------------------------------------- video scripts -----

export const SCRIPTS = [
  {
    id: "script-01",
    title: "The 30-second problem",
    platform: "LinkedIn / Instagram Reel",
    goal: "Awareness",
    beats: [
      { t: "0-5s", visual: "Cluttered drawer of unlabeled items", line: "This is what lost and found looks like on most campuses." },
      { t: "5-15s", visual: "Text on screen: no record, no owner, no answer", line: "No record of what was found. No way to match it. No answer for the student." },
      { t: "15-25s", visual: "The product demo typing an item description", line: "Ibero Lost & Found turns a plain description into a searchable record." },
      { t: "25-30s", visual: "Logo and the pricing page", line: "See what it would cost your campus at the link below." },
    ],
  },
  {
    id: "script-02",
    title: "Live demo in 45 seconds",
    platform: "LinkedIn / email",
    goal: "Education",
    beats: [
      { t: "0-6s", visual: "Homepage hero", line: "Here is the whole idea in one screen." },
      { t: "6-24s", visual: "Click an example chip, result card appears", line: "Describe an item in plain English or Spanish. The demo pulls out the item, color, place and date. It uses simple rules, and it says so on screen." },
      { t: "24-38s", visual: "Scroll to the pricing tiers", line: "Pricing is a flat monthly price per campus, based on your student count." },
      { t: "38-45s", visual: "Primary button", line: "Put your own numbers into the simulator and see your price." },
    ],
  },
  {
    id: "script-03",
    title: "What a pilot looks like",
    platform: "Email / LinkedIn",
    goal: "Conversion",
    beats: [
      { t: "0-6s", visual: "Calendar with one semester highlighted", line: "A pilot is one campus and one semester." },
      { t: "6-22s", visual: "Four metrics appearing one by one", line: "We track items reported, items returned, time to return, and questions your team no longer answers by hand." },
      { t: "22-34s", visual: "Pricing simulator result", line: "You see the cost before you talk to anyone. Private universities pay a 15 percent premium, annual billing takes 25 percent off." },
      { t: "34-40s", visual: "Call to action", line: "Plan your pilot with the simulator at the link below." },
    ],
  },
];

// ---------------------------------------------------- 14-day calendar ------

export const CAMPAIGN_PHASES = [
  { key: "awareness", label: "Awareness", days: "Days 1 to 4", goal: "Make administrators recognize the problem." },
  { key: "education", label: "Education", days: "Days 5 to 8", goal: "Show how a process fixes it." },
  { key: "proof", label: "Proof", days: "Days 9 to 11", goal: "Let them try it and see the numbers." },
  { key: "conversion", label: "Conversion", days: "Days 12 to 14", goal: "Move them to the pricing simulator." },
];

// Each day points at a real post or script id (checked by the tests).
export const CALENDAR = [
  { day: 1, phase: "awareness", channel: "LinkedIn", assetId: "post-01", cta: "Reply with how you track items today" },
  { day: 2, phase: "awareness", channel: "X", assetId: "post-02", cta: "Follow for the build log" },
  { day: 3, phase: "awareness", channel: "Instagram", assetId: "post-04", cta: "Share with your student services team" },
  { day: 4, phase: "awareness", channel: "LinkedIn", assetId: "script-01", cta: "Watch the 30-second video" },
  { day: 5, phase: "education", channel: "LinkedIn", assetId: "post-03", cta: "Run the 5-minute audit" },
  { day: 6, phase: "education", channel: "LinkedIn", assetId: "post-05", cta: "Try the live demo" },
  { day: 7, phase: "education", channel: "X", assetId: "post-06", cta: "Try the live demo" },
  { day: 8, phase: "education", channel: "Instagram", assetId: "post-08", cta: "See the A/B results" },
  { day: 9, phase: "proof", channel: "LinkedIn", assetId: "script-02", cta: "Watch the 45-second demo" },
  { day: 10, phase: "proof", channel: "LinkedIn", assetId: "post-09", cta: "Read what a pilot measures" },
  { day: 11, phase: "proof", channel: "Email", assetId: "script-03", cta: "Send the pilot video by email" },
  { day: 12, phase: "conversion", channel: "LinkedIn", assetId: "post-07", cta: "Open the pricing simulator" },
  { day: 13, phase: "conversion", channel: "X", assetId: "post-10", cta: "Open the pricing simulator" },
  { day: 14, phase: "conversion", channel: "LinkedIn", assetId: "script-03", cta: "Plan my campus pilot", note: "Repurpose the day 11 pilot video as a LinkedIn native video." },
];

export function getAsset(id) {
  return POSTS.find((p) => p.id === id) || SCRIPTS.find((s) => s.id === id) || null;
}

export function scriptToText(script) {
  const lines = [`${script.title} (${script.platform})`, `Goal: ${script.goal}`, ""];
  for (const b of script.beats) {
    lines.push(`[${b.t}] Visual: ${b.visual}`);
    lines.push(`Say: ${b.line}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}

// Total seconds a script runs, parsed from its last beat ("34-40s" -> 40).
export function scriptDuration(script) {
  const last = script.beats[script.beats.length - 1].t;
  const m = last.match(/(\d+)\s*s$/);
  return m ? Number(m[1]) : 0;
}
