// Week 6: pure helpers for the integrated venture pages (navigation, dashboard summary,
// privacy, impact and viability maths, roadmap ranking). No React, no network.

export const NAV_LINKS = [
  { href: "/demo", label: "Demo" },
  { href: "/chat", label: "Report an item" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agents", label: "Agents" },
  { href: "/product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/marketing", label: "Marketing" },
  { href: "/research", label: "Research" },
  { href: "/docs", label: "Docs" },
];

export const FOOTER_LINKS = [
  { href: "/impact", label: "Impact and viability" },
  { href: "/roadmap", label: "Version 2 roadmap" },
  { href: "/chat/results", label: "Staff view" },
  { href: "/core", label: "Item extractor" },
];

export const ALL_ROUTES = ["/", ...new Set([...NAV_LINKS, ...FOOTER_LINKS].map((l) => l.href))];

// Fields that must never be shown on a public page.
const PRIVATE_KEYS = ["transcript", "feedback", "email", "phone", "contact", "comment"];
const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const LONG_DIGITS = /\+?\d[\d\s().-]{6,}\d/g;
// Timestamps and ids look like long digit strings but are not personal data.
const SAFE_VALUE = /^(\d{4}-\d{2}-\d{2}([T ][\d:.]+(Z|[+-]\d{2}:?\d{2})?)?|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function sanitizeRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row || {})) {
    if (PRIVATE_KEYS.includes(k)) continue;
    out[k] = typeof v === "string" && !SAFE_VALUE.test(v) ? v.replace(EMAIL, "[removed]").replace(LONG_DIGITS, "[removed]") : v;
  }
  return out;
}

const CLOSED = new Set(["returned", "closed"]);

export function summarizeDashboard({ sessions = [], abEvents = [], assets = [], scenarios = [], extractions = [], research = [], userTests = [] } = {}) {
  const rows = sessions.filter(Boolean);
  const up = rows.filter((r) => r.rating === "up").length;
  const down = rows.filter((r) => r.rating === "down").length;
  const rated = up + down;
  return {
    reports: rows.length,
    returned: rows.filter((r) => r.status === "returned").length,
    open: rows.filter((r) => !CLOSED.has(r.status)).length,
    thumbsUpPct: rated ? Math.round((up / rated) * 100) : null,
    abImpressions: abEvents.filter((e) => e && e.event === "impression").length,
    abClicks: abEvents.filter((e) => e && e.event === "click").length,
    assets: assets.length,
    scenarios: scenarios.length,
    extractions: extractions.length,
    research: research.length,
    externalUsers: new Set(userTests.filter(Boolean).map((t) => t.tester_tag)).size,
  };
}

function numbers(rows, field) {
  return rows.map((r) => Number(r && r[field])).filter((n) => Number.isFinite(n) && n > 0);
}

export function medianMinutes(rows, field = "minutes") {
  const a = numbers(rows, field).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

export function passRule(tests, min = 4) {
  const total = tests.length;
  const finishedAlone = tests.filter((t) => t && t.finished_alone === true).length;
  return { finishedAlone, total, pass: total > 0 && finishedAlone >= min };
}

export const MIN_ANSWERS = 3;

export function impactFromTests(tests) {
  const withChat = medianMinutes(tests, "minutes");
  const baseline = medianMinutes(tests, "baseline_minutes");
  if (withChat === null || baseline === null) return null;
  const nWithChat = numbers(tests, "minutes").length;
  const nBaseline = numbers(tests, "baseline_minutes").length;
  // A comparison needs enough people on both sides; with fewer, show the numbers but claim no saving.
  const enough = nWithChat >= MIN_ANSWERS && nBaseline >= MIN_ANSWERS;
  const savedMinutes = enough ? Math.round((baseline - withChat) * 10) / 10 : null;
  return { withChat, baseline, nWithChat, nBaseline, enough, savedMinutes, savedPct: enough ? Math.round((savedMinutes / baseline) * 100) : null };
}

export function rankRoadmap(items) {
  return items
    .map((i) => ({ ...i, score: Math.round((i.impact / i.effort) * 100) / 100 }))
    .sort((a, b) => b.score - a.score || b.impact - a.impact || String(a.id).localeCompare(String(b.id)));
}

export function breakEvenCustomers(monthlyCost, pricePerCustomer) {
  if (!(pricePerCustomer > 0)) return null;
  if (monthlyCost <= 0) return 0;
  return Math.ceil(monthlyCost / pricePerCustomer);
}
