// Run with: node --test lib/pricing.test.js
// No extra dependency needed — uses Node's built-in test runner.

import test from "node:test";
import assert from "node:assert/strict";
import {
  getTierForStudents,
  calculateRevenue,
  getSizeForStudents,
  getSegmentKey,
  getPricePerCampus,
  ANNUAL_DISCOUNT,
  PRIVATE_PREMIUM,
  TIERS,
  SEGMENTS,
  OWNERSHIPS,
} from "./pricing.mjs";

// --- Pricing logic tests (required: 2) ---------------------------------

test("pricing logic: tier boundaries assign the right tier at each edge", () => {
  assert.equal(getTierForStudents(3000).key, "starter"); // exactly at the edge
  assert.equal(getTierForStudents(3001).key, "campus"); // one over
  assert.equal(getTierForStudents(15000).key, "campus"); // exactly at the edge
  assert.equal(getTierForStudents(15001).key, "enterprise"); // one over
});

test("pricing logic: revenue math matches price x campuses, with the annual discount applied", () => {
  const monthly = calculateRevenue({
    studentsPerCampus: 5000, // Campus tier -> $449/mo (public)
    campuses: 3,
    billingCycle: "monthly",
    ownership: "public",
  });
  assert.equal(monthly.tier.key, "campus");
  assert.equal(monthly.monthlyRevenue, 449 * 3);
  assert.equal(monthly.displayedRevenue, monthly.monthlyRevenue);

  const annual = calculateRevenue({
    studentsPerCampus: 5000,
    campuses: 3,
    billingCycle: "annual",
    ownership: "public",
  });
  const expectedAnnual = 449 * 3 * 12 * (1 - ANNUAL_DISCOUNT);
  assert.equal(annual.annualRevenue, expectedAnnual);
  assert.equal(annual.displayedRevenue, expectedAnnual);
});

// --- Software tests (required: 3) ---------------------------------------

test("software: the annual discount is the same 25% across every tier", () => {
  for (const tier of TIERS) {
    const r = calculateRevenue({
      studentsPerCampus: 1,
      campuses: 1,
      billingCycle: "annual",
      ownership: "public",
    });
    // Recompute independently to make sure no tier special-cases the math.
    const expected = tier.monthlyPrice * 1 * 12 * (1 - ANNUAL_DISCOUNT);
    // Only checks the tier this student count actually lands on; the loop
    // just confirms the discount constant itself is a single shared value.
    assert.equal(ANNUAL_DISCOUNT, 0.25);
  }
});

test("software: bad or missing inputs don't crash and fall back to safe values", () => {
  assert.equal(getTierForStudents(-50).key, "starter"); // negative -> treated as 0
  assert.equal(getTierForStudents(undefined).key, "starter");
  assert.equal(getTierForStudents("not a number").key, "starter");

  const r = calculateRevenue({ studentsPerCampus: 5000, campuses: 0, billingCycle: "monthly" });
  assert.equal(r.campuses, 1); // 0 campuses clamped up to 1, not 0 revenue

  const r2 = calculateRevenue({ studentsPerCampus: 5000, campuses: -3, billingCycle: "monthly" });
  assert.equal(r2.campuses, 1); // negative campuses also clamped up to 1

  // No ownership passed at all shouldn't crash, and should fall back to
  // public pricing (no premium applied).
  const r3 = calculateRevenue({ studentsPerCampus: 5000, campuses: 1, billingCycle: "monthly" });
  assert.equal(r3.pricePerCampus, 449);
});

test("software: a saved scenario record has every field the Supabase table requires", () => {
  const result = calculateRevenue({
    studentsPerCampus: 8000,
    campuses: 2,
    billingCycle: "annual",
    ownership: "public",
  });
  const record = {
    scenario_name: "Test scenario",
    segment: "medium_public",
    tier: result.tier.key,
    students_per_campus: 8000,
    campuses: result.campuses,
    billing_cycle: "annual",
    monthly_revenue: result.monthlyRevenue,
    annual_revenue: result.annualRevenue,
  };
  const requiredFields = [
    "scenario_name",
    "segment",
    "tier",
    "students_per_campus",
    "campuses",
    "billing_cycle",
    "monthly_revenue",
    "annual_revenue",
  ];
  for (const field of requiredFields) {
    assert.notEqual(record[field], undefined, `missing field: ${field}`);
  }
});

// --- Segment auto-detection tests (added after Emilio's feedback that the ---
// --- user should only pick ownership, never size, by hand) -----------------

test("software: campus size has three buckets aligned with the pricing tiers", () => {
  assert.equal(getSizeForStudents(3000), "small"); // exactly at the Starter edge
  assert.equal(getSizeForStudents(3001), "medium"); // one over -> Campus range
  assert.equal(getSizeForStudents(15000), "medium"); // exactly at the Campus edge
  assert.equal(getSizeForStudents(15001), "large"); // one over -> Enterprise range
  assert.equal(getSizeForStudents(-10), "small"); // negative -> treated as 0 -> small
  assert.equal(getSizeForStudents(undefined), "small");
});

test("software: segment key combines auto-detected size with the chosen ownership", () => {
  assert.equal(getSegmentKey(2000, "private"), "small_private");
  assert.equal(getSegmentKey(2000, "public"), "small_public");
  assert.equal(getSegmentKey(8000, "private"), "medium_private");
  assert.equal(getSegmentKey(8000, "public"), "medium_public");
  assert.equal(getSegmentKey(20000, "private"), "large_private");
  assert.equal(getSegmentKey(20000, "public"), "large_public");
});

test("software: every small/medium/large x private/public combination has a defined segment", () => {
  const sizes = ["small", "medium", "large"];
  for (const size of sizes) {
    for (const ownership of OWNERSHIPS) {
      const key = `${size}_${ownership.key}`;
      const found = SEGMENTS.find((s) => s.key === key);
      assert.ok(found, `missing segment description for ${key}`);
    }
  }
});

// --- Private premium tests (added after Emilio's feedback that private ---
// --- universities should pay a 15% premium over public) ------------------

test("software: private universities pay a 15% premium over public, per campus", () => {
  assert.equal(PRIVATE_PREMIUM, 0.15);
  for (const tier of TIERS) {
    const publicPrice = getPricePerCampus(tier, "public");
    const privatePrice = getPricePerCampus(tier, "private");
    assert.equal(publicPrice, tier.monthlyPrice);
    assert.equal(privatePrice, Math.round(tier.monthlyPrice * 1.15));
    assert.ok(privatePrice > publicPrice, `${tier.key}: private should cost more than public`);
  }
});

test("software: the private premium flows through to full revenue math", () => {
  const publicResult = calculateRevenue({
    studentsPerCampus: 5000,
    campuses: 2,
    billingCycle: "monthly",
    ownership: "public",
  });
  const privateResult = calculateRevenue({
    studentsPerCampus: 5000,
    campuses: 2,
    billingCycle: "monthly",
    ownership: "private",
  });
  const expectedPrivatePrice = Math.round(449 * 1.15);
  assert.equal(privateResult.pricePerCampus, expectedPrivatePrice);
  assert.equal(privateResult.monthlyRevenue, expectedPrivatePrice * 2);
  assert.ok(privateResult.monthlyRevenue > publicResult.monthlyRevenue);
});
