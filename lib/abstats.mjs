// Statistics for the live A/B tests. Pure functions.
//
// Metric: click-through rate = visitors who clicked / visitors who saw the
// variant (each visitor counted once per test, enforced by a unique index in
// Supabase). Significance uses a two-proportion z-test.

export function rate(clicks, impressions) {
  if (!impressions || impressions <= 0) return 0;
  return clicks / impressions;
}

// Standard normal CDF via the Abramowitz and Stegun 7.1.26 erf approximation
// (max error about 1.5e-7, plenty for a p-value shown to 3 decimals).
export function normalCdf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const poly =
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) * t;
  const erf = 1 - poly * Math.exp(-(x * x) / 2);
  return 0.5 * (1 + (x >= 0 ? erf : -erf));
}

/**
 * Two-sided two-proportion z-test. Returns { z, p } or { z: 0, p: 1 } when
 * the test cannot be computed (no impressions, or no variation at all).
 */
export function twoProportionZTest(clicksA, nA, clicksB, nB) {
  if (!nA || !nB) return { z: 0, p: 1 };
  const pA = clicksA / nA;
  const pB = clicksB / nB;
  const pooled = (clicksA + clicksB) / (nA + nB);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / nA + 1 / nB));
  if (se === 0) return { z: 0, p: 1 };
  const z = (pB - pA) / se;
  const p = 2 * (1 - normalCdf(Math.abs(z)));
  return { z, p: Math.min(1, Math.max(0, p)) };
}

/**
 * Turn raw ab_events rows ({ test_key, variant, event, visitor_id }) into
 * per-variant counts for one test. Counts distinct visitors, so duplicate rows
 * (should never exist, but are cheap to guard against) are ignored. A click
 * only counts if that visitor also has an impression.
 */
export function summarizeTest(events, testKey) {
  const seen = { A: new Set(), B: new Set() };
  const clicked = { A: new Set(), B: new Set() };
  for (const e of events || []) {
    if (e.test_key !== testKey || !seen[e.variant]) continue;
    if (e.event === "impression") seen[e.variant].add(e.visitor_id);
    if (e.event === "click") clicked[e.variant].add(e.visitor_id);
  }
  const out = {};
  for (const v of ["A", "B"]) {
    const impressions = seen[v].size;
    const clicks = [...clicked[v]].filter((id) => seen[v].has(id)).length;
    out[v] = { impressions, clicks, rate: rate(clicks, impressions) };
  }
  return out;
}

/**
 * Plain-language verdict for one test.
 *   no_data       nobody has seen the test yet
 *   insufficient  at least one variant is under the minimum sample
 *   significant   p below alpha, with a winner
 *   inconclusive  enough data but no real difference
 */
export function verdictFor(summary, { minPerVariant = 30, alpha = 0.05 } = {}) {
  const a = summary.A;
  const b = summary.B;
  if (a.impressions + b.impressions === 0) {
    return { status: "no_data", winner: null, lift: 0, p: 1, z: 0 };
  }
  const { z, p } = twoProportionZTest(a.clicks, a.impressions, b.clicks, b.impressions);
  const lift = a.rate > 0 ? (b.rate - a.rate) / a.rate : b.rate > 0 ? Infinity : 0;
  if (a.impressions < minPerVariant || b.impressions < minPerVariant) {
    return { status: "insufficient", winner: null, lift, p, z };
  }
  if (p < alpha) {
    return { status: "significant", winner: b.rate > a.rate ? "B" : "A", lift, p, z };
  }
  return { status: "inconclusive", winner: null, lift, p, z };
}
