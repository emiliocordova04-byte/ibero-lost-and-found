// Run with: node --test lib/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execSync } from "node:child_process";
import {
  NAV_LINKS,
  FOOTER_LINKS,
  ALL_ROUTES,
  sanitizeRow,
  summarizeDashboard,
  medianMinutes,
  passRule,
  impactFromTests,
  rankRoadmap,
  breakEvenCustomers,
} from "./venture.mjs";
import { AGENTS, ROADMAP, HARMS, BUILD_LOG, PROMPT_LIBRARY } from "./ventureData.mjs";

// Week 6 tests (venture 1 to 8)

test("venture 1: every link in the header and footer has a page file", () => {
  const hrefs = [...NAV_LINKS, ...FOOTER_LINKS].map((l) => l.href);
  assert.ok(hrefs.includes("/demo") && hrefs.includes("/dashboard") && hrefs.includes("/agents"));
  for (const h of hrefs) {
    const file = h === "/" ? "app/page.js" : `app/${h.slice(1)}/page.js`;
    assert.ok(fs.existsSync(file), `no page file for ${h} (${file})`);
  }
  assert.equal(new Set(ALL_ROUTES).size, ALL_ROUTES.length, "routes must be unique");
  assert.ok(ALL_ROUTES.includes("/"));
});

test("venture 2: summarizeDashboard counts every module, also with empty and odd rows", () => {
  const empty = summarizeDashboard({});
  assert.deepEqual([empty.reports, empty.returned, empty.open, empty.externalUsers], [0, 0, 0, 0]);
  assert.equal(empty.thumbsUpPct, null);
  const s = summarizeDashboard({
    sessions: [
      { status: "returned", rating: "up" },
      { status: "pending_staff_review", rating: "down" },
      { status: "found", rating: null },
      { status: "closed", rating: "up" },
      null,
    ],
    abEvents: [{ event: "impression" }, { event: "impression" }, { event: "click" }],
    assets: [{}, {}],
    scenarios: [{}],
    extractions: [{}, {}, {}],
    research: [{}, {}],
    userTests: [{ tester_tag: "T1" }, { tester_tag: "T1" }, { tester_tag: "T2" }],
  });
  assert.equal(s.reports, 4);
  assert.equal(s.returned, 1);
  assert.equal(s.open, 2); // pending and found are still open
  assert.equal(s.thumbsUpPct, 67); // 2 up of 3 rated
  assert.deepEqual([s.abImpressions, s.abClicks], [2, 1]);
  assert.deepEqual([s.assets, s.scenarios, s.extractions, s.research], [2, 1, 3, 2]);
  assert.equal(s.externalUsers, 2, "the same tester tag counts once");
});

test("venture 3: sanitizeRow removes transcripts, comments and contact data", () => {
  const row = sanitizeRow({
    id: 1, item: "Nike backpack", place: "The library",
    transcript: [{ text: "x" }], feedback: "call me", email: "ana@uni.mx", phone: "5512345678",
    note: "write to ana@uni.mx or +52 55 1234 5678",
  });
  assert.equal(row.item, "Nike backpack");
  for (const k of ["transcript", "feedback", "email", "phone"]) assert.ok(!(k in row), k);
  assert.ok(!/ana@uni\.mx/.test(row.note) && !/1234/.test(row.note), row.note);
});

test("venture 4: medianMinutes ignores bad values; passRule needs 4 of 5 finishing alone", () => {
  assert.equal(medianMinutes([{ minutes: 4 }, { minutes: 2 }, { minutes: 6 }]), 4);
  assert.equal(medianMinutes([{ minutes: 2 }, { minutes: 4 }]), 3);
  assert.equal(medianMinutes([{ minutes: null }, { minutes: "x" }, { minutes: -1 }]), null);
  const mk = (n) => Array.from({ length: 5 }, (_, i) => ({ finished_alone: i < n }));
  assert.deepEqual(passRule(mk(4)), { finishedAlone: 4, total: 5, pass: true });
  assert.equal(passRule(mk(3)).pass, false);
  assert.equal(passRule([]).pass, false);
});

test("venture 5: impactFromTests compares minutes with the chat to minutes today", () => {
  assert.equal(impactFromTests([]), null);
  const r = impactFromTests([
    { minutes: 2, baseline_minutes: 10 },
    { minutes: 3, baseline_minutes: 8 },
    { minutes: 1, baseline_minutes: 6 },
  ]);
  assert.equal(r.withChat, 2);
  assert.equal(r.baseline, 8);
  assert.equal(r.savedMinutes, 6);
  assert.equal(r.savedPct, 75);
});

test("venture 6: rankRoadmap sorts by impact divided by effort and breaks ties by impact", () => {
  const r = rankRoadmap([
    { id: "a", impact: 4, effort: 2 },
    { id: "b", impact: 5, effort: 1 },
    { id: "c", impact: 2, effort: 1 },
    { id: "d", impact: 4, effort: 2 },
    { id: "e", impact: 6, effort: 3 },
  ]);
  // scores: b 5, e 2, a 2, d 2, c 2; ties go to the higher impact, then to the id
  assert.deepEqual(r.map((x) => x.id), ["b", "e", "a", "d", "c"]);
  assert.equal(r[0].id, "b");
  assert.equal(r[0].score, 5);
  assert.ok(r.every((x, i) => i === 0 || r[i - 1].score >= x.score));
  const rm = rankRoadmap(ROADMAP);
  assert.equal(rm[0].id, "auth", "staff login must be first on the roadmap");
});

test("venture 7: breakEvenCustomers rounds up and handles zero cost", () => {
  assert.equal(breakEvenCustomers(0, 199), 0);
  assert.equal(breakEvenCustomers(60, 199), 1);
  assert.equal(breakEvenCustomers(400, 199), 3);
  assert.equal(breakEvenCustomers(500, 0), null);
});

test("venture 8: agents, harms, prompts and the build log are complete and honest", () => {
  assert.ok(AGENTS.length >= 5);
  for (const a of AGENTS) {
    for (const k of ["id", "name", "route", "input", "output", "store", "guardrail", "kind", "human"]) {
      assert.ok(a[k] && String(a[k]).length > 0, `${a.id} missing ${k}`);
    }
    assert.ok(["rule-based", "simulated", "template", "human", "ai-assisted"].includes(a.kind), a.kind);
  }
  assert.ok(HARMS.length >= 6 && HARMS.every((h) => h.risk && h.mitigation && ["done", "open"].includes(h.status)));
  assert.ok(PROMPT_LIBRARY.length >= 6);
  const total = BUILD_LOG.reduce((n, m) => n + m.commits, 0);
  const git = Number(execSync("git rev-list --count HEAD").toString().trim());
  assert.ok(total <= git && git - total <= 40, `build log says ${total} commits, git has ${git}`);
});
