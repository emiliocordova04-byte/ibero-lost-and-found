// Pricing model for the Ibero Lost & Found "sell it to universities" simulation.
//
// Real decisions behind these numbers (Emilio, Week 3 Build Discipline Packet):
//   - Segments: small/private universities vs. large/public university systems.
//   - Tiers are cut by campus size (number of students), not by feature
//     gating alone, because that's how the competitors researched in Week 2
//     (vFound.io, Chargerback, RepoApp) actually price campus software.
//   - Scope cut: no admin dashboard for managing subscriptions this week —
//     this is a pricing *simulator*, not a billing system.
//
// All prices are simulated (USD/month) for the exercise, not real quotes.

export const ANNUAL_DISCOUNT = 0.15; // 15% off the monthly rate when billed annually

export const TIERS = [
  {
    key: "starter",
    name: "Starter",
    maxStudents: 3000, // up to 3,000 students
    monthlyPrice: 149,
    segment: "small_private",
    blurb: "For a single small or private campus getting off manual lost-and-found.",
  },
  {
    key: "campus",
    name: "Campus",
    maxStudents: 15000, // 3,001 - 15,000 students
    monthlyPrice: 399,
    segment: "small_private",
    blurb: "For a mid-size campus that needs search, filtering, and reporting.",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    maxStudents: Infinity, // 15,001+ students
    monthlyPrice: 899,
    segment: "large_public",
    blurb: "For large public university systems running multiple campuses.",
  },
];

export const SEGMENTS = [
  {
    key: "small_private",
    name: "Small / private universities",
    description:
      "Fewer students, tighter budgets, want something they can turn on in a week without procurement. Usually fits Starter or Campus.",
  },
  {
    key: "large_public",
    name: "Large / public university systems",
    description:
      "Many campuses and students, longer procurement cycles, need multi-campus support and integrations. Usually fits Campus or Enterprise.",
  },
];

// Feature map: which features unlock at which tier. Every tier includes
// everything from the tiers before it.
export const FEATURES = [
  { key: "intake", label: "Lost & found intake form", tiers: ["starter", "campus", "enterprise"] },
  { key: "manual_match", label: "Manual matching + email notifications", tiers: ["starter", "campus", "enterprise"] },
  { key: "search_filter", label: "Search & filter across items", tiers: ["campus", "enterprise"] },
  { key: "benchmark_dash", label: "Research & benchmarking dashboard", tiers: ["campus", "enterprise"] },
  { key: "csv_export", label: "CSV export", tiers: ["campus", "enterprise"] },
  { key: "multi_campus", label: "Multi-campus support", tiers: ["enterprise"] },
  { key: "api_access", label: "API access", tiers: ["enterprise"] },
  { key: "priority_support", label: "Priority support", tiers: ["enterprise"] },
];

/**
 * Given a number of students on one campus, return the tier that applies.
 * Boundaries are inclusive on the tier's maxStudents (e.g. exactly 3000
 * students is still Starter; 3001 is Campus).
 */
export function getTierForStudents(students) {
  const n = Number(students);
  const safe = Number.isFinite(n) && n > 0 ? n : 0;
  return TIERS.find((t) => safe <= t.maxStudents) || TIERS[TIERS.length - 1];
}

/**
 * Revenue math for one scenario.
 * - pricePerCampus: the tier's monthly price
 * - monthlyRevenue: pricePerCampus * number of campuses
 * - annualRevenue: monthlyRevenue * 12 * (1 - ANNUAL_DISCOUNT)
 *
 * campuses is clamped to a minimum of 1 (a deal can't be for zero campuses).
 */
export function calculateRevenue({ studentsPerCampus, campuses, billingCycle }) {
  const tier = getTierForStudents(studentsPerCampus);
  const safeCampuses = Math.max(1, Math.round(Number(campuses) || 1));
  const monthlyRevenue = tier.monthlyPrice * safeCampuses;
  const annualRevenue = monthlyRevenue * 12 * (1 - ANNUAL_DISCOUNT);

  return {
    tier,
    campuses: safeCampuses,
    pricePerCampus: tier.monthlyPrice,
    monthlyRevenue,
    annualRevenue,
    displayedRevenue: billingCycle === "annual" ? annualRevenue : monthlyRevenue,
  };
}
