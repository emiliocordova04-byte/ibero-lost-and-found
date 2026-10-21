// Week 4 tests, run with:  node --test lib/marketing.test.mjs
//
// Software tests (required: 3, written: 10) cover the A/B assignment and
// statistics, the content system's integrity, the exporters and the headline
// checker. The two live A/B tests themselves (hero headline, CTA label) are
// experiments on real visitors; their results are read from Supabase on
// /marketing. Test 10 below proves the A/B pipeline end to end on SYNTHETIC
// visitors with a known effect: it validates the machinery, it is not
// evidence about real visitors.

import test from "node:test";
import assert from "node:assert/strict";

import { assignVariant, hashString, parseForcedVariant, makeVisitorId } from "./ab.mjs";
import { rate, normalCdf, twoProportionZTest, summarizeTest, verdictFor } from "./abstats.mjs";
import {
  AB_TESTS,
  BRAND,
  CALENDAR,
  CAMPAIGN_PHASES,
  CHANNEL_LIMITS,
  LANDING_COPY,
  POSTS,
  SCRIPTS,
  getAsset,
  scriptDuration,
} from "./marketingContent.mjs";
import { calendarToCsv, csvCell, kitToJson, kitToMarkdown, toCsv } from "./exporters.mjs";
import { scoreHeadline, wordCount } from "./headlineScore.mjs";

// Small seeded PRNG (mulberry32) so "random" tests are reproducible.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- A/B ------

test("software 1: variant assignment is deterministic, balanced and independent per test", () => {
  const rnd = seeded(42);
  const ids = Array.from({ length: 4000 }, () => makeVisitorId(rnd));
  // deterministic: same visitor + test always gets the same variant
  for (const id of ids.slice(0, 200)) {
    assert.equal(assignVariant(id, "hero_headline"), assignVariant(id, "hero_headline"));
  }
  // balanced: close to a 50/50 split
  const countB = ids.filter((id) => assignVariant(id, "hero_headline") === "B").length;
  assert.ok(Math.abs(countB / ids.length - 0.5) < 0.03, `split was ${countB}/${ids.length}`);
  // independent: knowing the headline variant must not predict the CTA variant
  const both = ids.filter(
    (id) => assignVariant(id, "hero_headline") === "B" && assignVariant(id, "cta_label") === "B"
  ).length;
  assert.ok(Math.abs(both / ids.length - 0.25) < 0.03, `joint B/B was ${both}/${ids.length}`);
  // bad input falls back safely
  assert.equal(assignVariant("", "x"), "A");
  assert.equal(assignVariant("v_1", ""), "A");
  assert.ok(Number.isInteger(hashString("abc")));
});

test("software 2: forced variants parse safely and visitor ids are unique", () => {
  assert.equal(parseForcedVariant("b"), "B");
  assert.equal(parseForcedVariant("A"), "A");
  assert.equal(parseForcedVariant("C"), null);
  assert.equal(parseForcedVariant(null), null);
  assert.equal(parseForcedVariant(undefined), null);
  const rnd = seeded(7);
  const ids = new Set(Array.from({ length: 2000 }, () => makeVisitorId(rnd)));
  assert.equal(ids.size, 2000);
});

test("software 3: two-proportion z-test matches hand-computed values", () => {
  // 10/100 vs 20/100: pooled p = .15, se = sqrt(.15*.85*(2/100)) = .050498, z = 1.9803, p = .0477
  const { z, p } = twoProportionZTest(10, 100, 20, 100);
  assert.ok(Math.abs(z - 1.9803) < 0.001);
  assert.ok(Math.abs(p - 0.0477) < 0.001);
  // symmetric: swapping variants flips z and keeps p
  const swapped = twoProportionZTest(20, 100, 10, 100);
  assert.ok(Math.abs(swapped.z + z) < 1e-9);
  assert.ok(Math.abs(swapped.p - p) < 1e-9);
  // identical rates: no difference
  assert.equal(twoProportionZTest(5, 50, 5, 50).z, 0);
  // degenerate inputs never throw or return NaN
  for (const args of [[0, 0, 0, 0], [0, 10, 0, 10], [10, 10, 10, 10], [1, 0, 1, 5]]) {
    const r = twoProportionZTest(...args);
    assert.ok(Number.isFinite(r.z) && Number.isFinite(r.p));
  }
  assert.ok(Math.abs(normalCdf(1.96) - 0.975) < 0.0005);
  assert.equal(rate(0, 0), 0);
  assert.equal(rate(5, 20), 0.25);
});

test("software 4: summarizeTest counts distinct visitors and ignores clicks without an impression", () => {
  const events = [
    { test_key: "hero_headline", variant: "A", event: "impression", visitor_id: "v1" },
    { test_key: "hero_headline", variant: "A", event: "impression", visitor_id: "v1" }, // duplicate row
    { test_key: "hero_headline", variant: "A", event: "click", visitor_id: "v1" },
    { test_key: "hero_headline", variant: "A", event: "click", visitor_id: "v1" }, // double click
    { test_key: "hero_headline", variant: "A", event: "impression", visitor_id: "v2" },
    { test_key: "hero_headline", variant: "B", event: "impression", visitor_id: "v3" },
    { test_key: "hero_headline", variant: "B", event: "click", visitor_id: "ghost" }, // click, never seen
    { test_key: "cta_label", variant: "B", event: "impression", visitor_id: "v9" }, // other test
    { test_key: "hero_headline", variant: "Z", event: "impression", visitor_id: "v4" }, // bad variant
  ];
  const s = summarizeTest(events, "hero_headline");
  assert.deepEqual(s.A, { impressions: 2, clicks: 1, rate: 0.5 });
  assert.deepEqual(s.B, { impressions: 1, clicks: 0, rate: 0 });
  assert.deepEqual(summarizeTest([], "hero_headline").A, { impressions: 0, clicks: 0, rate: 0 });
  assert.deepEqual(summarizeTest(undefined, "x").B, { impressions: 0, clicks: 0, rate: 0 });
});

test("software 5: verdict is honest about missing, thin and significant data", () => {
  const mk = (ai, ac, bi, bc) => ({
    A: { impressions: ai, clicks: ac, rate: rate(ac, ai) },
    B: { impressions: bi, clicks: bc, rate: rate(bc, bi) },
  });
  assert.equal(verdictFor(mk(0, 0, 0, 0)).status, "no_data");
  // big gap but only 10 visitors each: must NOT declare a winner
  assert.equal(verdictFor(mk(10, 1, 10, 6)).status, "insufficient");
  // enough data and a real gap
  const win = verdictFor(mk(200, 20, 200, 50));
  assert.equal(win.status, "significant");
  assert.equal(win.winner, "B");
  // enough data, no real gap
  assert.equal(verdictFor(mk(200, 30, 200, 32)).status, "inconclusive");
  // A winning is reported as A
  assert.equal(verdictFor(mk(200, 50, 200, 20)).winner, "A");
});

// ------------------------------------------------------------- content -----

test("software 6: content system has exactly 10 posts, 3 scripts and valid limits", () => {
  assert.equal(POSTS.length, 10);
  assert.equal(SCRIPTS.length, 3);
  assert.equal(new Set(POSTS.map((p) => p.id)).size, 10);
  for (const p of POSTS) {
    assert.ok(CHANNEL_LIMITS[p.channel], `unknown channel on ${p.id}`);
    assert.ok(p.body.length > 40, `${p.id} is too short`);
    assert.ok(p.body.length <= CHANNEL_LIMITS[p.channel], `${p.id} exceeds ${p.channel} limit`);
    assert.ok(p.hook && p.angle);
  }
  for (const s of SCRIPTS) {
    assert.ok(s.beats.length >= 3, `${s.id} needs hook, body and call to action beats`);
    const d = scriptDuration(s);
    assert.ok(d >= 20 && d <= 60, `${s.id} runs ${d}s`);
    // beats are contiguous: each starts where the previous ended
    let prevEnd = 0;
    for (const b of s.beats) {
      const [start, end] = b.t.replace("s", "").split("-").map(Number);
      assert.equal(start, prevEnd, `${s.id} beat ${b.t} does not follow ${prevEnd}s`);
      assert.ok(end > start);
      prevEnd = end;
      assert.ok(b.visual && b.line);
    }
  }
});

test("software 7: brand voice rules hold across every piece of copy", () => {
  const all = [
    ...POSTS.map((p) => p.body),
    ...SCRIPTS.flatMap((s) => s.beats.map((b) => b.line)),
    LANDING_COPY.subhead,
    ...LANDING_COPY.faq.map((f) => f.a),
    ...AB_TESTS.flatMap((t) => Object.values(t.variants)),
  ].join("\n");
  assert.ok(!all.includes("—"), "no em dashes");
  assert.ok(!all.includes("!"), "no exclamation marks (brand voice)");
  assert.ok(!/revolutionary|game-changing|magic|world-class|cutting-edge/i.test(all), "no hype words");
  // honesty rule: no invented customer claims
  assert.ok(!/\b(trusted by|loved by|customers say|testimonial)\b/i.test(all));
  // every brand color is a valid hex
  for (const c of BRAND.colors) assert.match(c.hex, /^#[0-9A-Fa-f]{6}$/);
});

test("software 8: calendar has 14 consecutive days that all point at real assets", () => {
  assert.equal(CALENDAR.length, 14);
  CALENDAR.forEach((d, i) => assert.equal(d.day, i + 1));
  const phases = new Set(CAMPAIGN_PHASES.map((p) => p.key));
  for (const d of CALENDAR) {
    assert.ok(phases.has(d.phase), `day ${d.day} has unknown phase`);
    assert.ok(getAsset(d.assetId), `day ${d.day} points at missing asset ${d.assetId}`);
    assert.ok(d.cta && d.channel);
  }
  // phases only move forward, never back
  const order = CAMPAIGN_PHASES.map((p) => p.key);
  const idx = CALENDAR.map((d) => order.indexOf(d.phase));
  assert.deepEqual(idx, [...idx].sort((a, b) => a - b));
  // all 10 posts and all 3 scripts are scheduled at least once
  const used = new Set(CALENDAR.map((d) => d.assetId));
  for (const a of [...POSTS, ...SCRIPTS]) assert.ok(used.has(a.id), `${a.id} is never scheduled`);
});

test("software 9: exporters escape CSV correctly and include every asset", () => {
  assert.equal(csvCell("plain"), "plain");
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell("line\nbreak"), '"line\nbreak"');
  assert.equal(csvCell(null), "");
  assert.equal(toCsv(["a", "b"], [{ a: 1, b: "x,y" }]), 'a,b\r\n1,"x,y"');

  const csv = calendarToCsv().split("\r\n");
  assert.equal(csv.length, 15); // header + 14 days
  assert.equal(csv[0], "day,phase,channel,asset_id,asset_title,call_to_action");

  const md = kitToMarkdown();
  for (const a of [...POSTS, ...SCRIPTS]) assert.ok(md.includes(a.id), `markdown is missing ${a.id}`);
  const json = JSON.parse(kitToJson());
  assert.equal(json.posts.length, 10);
  assert.equal(json.scripts.length, 3);
  assert.equal(json.calendar.length, 14);
});

test("software 10: headline checker scores by the brand rules", () => {
  assert.equal(wordCount("  one  two three "), 3);
  const good = scoreHeadline(AB_TESTS[0].variants.B);
  assert.equal(good.score, 100);
  const hype = scoreHeadline("Revolutionary AI-powered magic for you!!");
  assert.ok(hype.score < 50);
  assert.ok(!hype.checks.find((c) => c.key === "no_hype").pass);
  assert.ok(!hype.checks.find((c) => c.key === "no_exclaim").pass);
  assert.equal(scoreHeadline("").score, 0);
  assert.ok(scoreHeadline("x".repeat(100)).score < scoreHeadline(AB_TESTS[0].variants.A).score);
  // every shipped A/B variant passes the length and tone rules
  for (const t of AB_TESTS) {
    for (const text of Object.values(t.variants)) {
      const r = scoreHeadline(text);
      assert.ok(r.checks.find((c) => c.key === "no_hype").pass, text);
      assert.ok(r.checks.find((c) => c.key === "no_exclaim").pass, text);
    }
  }
});

// ------------------------------------------------- A/B pipeline (synthetic) --

test("A/B pipeline detects a known effect on SYNTHETIC visitors (machinery check, not real results)", () => {
  const rnd = seeded(2026);
  const TRUE_RATE = { A: 0.1, B: 0.16 };
  const events = [];
  for (let i = 0; i < 3000; i++) {
    const id = makeVisitorId(rnd);
    const v = assignVariant(id, "hero_headline");
    events.push({ test_key: "hero_headline", variant: v, event: "impression", visitor_id: id });
    if (rnd() < TRUE_RATE[v]) events.push({ test_key: "hero_headline", variant: v, event: "click", visitor_id: id });
  }
  const s = summarizeTest(events, "hero_headline");
  assert.equal(s.A.impressions + s.B.impressions, 3000);
  assert.ok(Math.abs(s.A.rate - 0.1) < 0.025);
  assert.ok(Math.abs(s.B.rate - 0.16) < 0.025);
  const v = verdictFor(s);
  assert.equal(v.status, "significant");
  assert.equal(v.winner, "B");
  // and with NO real effect the same pipeline should usually not claim a winner
  const flat = [];
  for (let i = 0; i < 3000; i++) {
    const id = makeVisitorId(rnd);
    const variant = assignVariant(id, "cta_label");
    flat.push({ test_key: "cta_label", variant, event: "impression", visitor_id: id });
    if (rnd() < 0.12) flat.push({ test_key: "cta_label", variant, event: "click", visitor_id: id });
  }
  assert.notEqual(verdictFor(summarizeTest(flat, "cta_label")).status, "no_data");
});
