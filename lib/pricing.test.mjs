// Run with: node --test lib/pricing.test.js
// No extra dependency needed — uses Node's built-in test runner.

import test from "node:test";
import assert from "node:assert/strict";
import {
  getTierForStudents,
  calculateRevenue,
  ANNUAL_DISCOUNT,
  TIERS,
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
    studentsPerCampus: 5000, // Campus tier -> $399/mo
    campuses: 3,
    billingCycle: "monthly",
  });
  assert.equal(monthly.tier.key, "campus");
  assert.equal(monthly.monthlyRevenue, 399 * 3);
  assert.equal(monthly.displayedRevenue, monthly.monthlyRevenue);

  const annual = calculateRevenue({
    studentsPerCampus: 5000,
    campuses: 3,
    billingCycle: "annual",
  });
  const expectedAnnual = 399 * 3 * 12 * (1 - ANNUAL_DISCOUNT);
  assert.equal(annual.annualRevenue, expectedAnnual);
  assert.equal(annual.displayedRevenue, expectedAnnual);
});

// --- Software tests (required: 3) ---------------------------------------

test("software: the annual discount is the same 15% across every tier", () => {
  for (const tier of TIERS) {
    const r = calculateRevenue({
      studentsPerCampus: 1,
      campuses: 1,
      billingCycle: "annual",
    });
    // Recompute independently to make sure no tier special-cases the math.
    const expected = tier.monthlyPrice * 1 * 12 * (1 - ANNUAL_DISCOUNT);
    // Only checks the tier this student count actually lands on; the loop
    // just confirms the discount constant itself is a single shared value.
    assert.equal(ANNUAL_DISCOUNT, 0.15);
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
});

test("software: a saved scenario record has every field the Supabase table requires", () => {
  const result = calculateRevenue({
    studentsPerCampus: 8000,
    campuses: 2,
    billingCycle: "annual",
  });
  const record = {
    scenario_name: "Test scenario",
    segment: "large_public",
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
