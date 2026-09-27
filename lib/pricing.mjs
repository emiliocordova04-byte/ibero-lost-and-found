// Pricing model for the Ibero Lost & Found "sell it to universities" simulation.
//
// Real decisions behind these numbers (Emilio, Week 3 Build Discipline Packet):
//   - Segments: campus size (small/medium/large) crossed with ownership
//     (private/public) — size is auto-detected from students per campus,
//     ownership is the one thing picked by hand.
//   - Tiers are cut by campus size (number of students), not by feature
//     gating alone, because that's how the competitors researched in Week 2
//     (vFound.io, Chargerback, RepoApp) actually price campus software.
//   - Private universities pay a 15% premium over public ones, per campus —
//     public institutions go through longer procurement but usually get
//     better negotiated rates; private ones move faster and pay for that.
//   - Scope cut: no admin dashboard for managing subscriptions this week —
//     this is a pricing *simulator*, not a billing system.
//
// All prices are simulated (USD/month) for the exercise, not real quotes.

export const ANNUAL_DISCOUNT = 0.25; // 25% off the monthly rate when billed annually
export const PRIVATE_PREMIUM = 0.15; // private universities pay 15% more than public, per campus

// Base (public) monthly price per campus for each tier. Private pricing is
// derived from this at display/calculation time via getPricePerCampus, so
// there is exactly one number to tune per tier.
export const TIERS = [
  {
    key: "starter",
    name: "Starter",
    maxStudents: 3000, // up to 3,000 students
    monthlyPrice: 199,
    segment: "small_private",
    blurb: "For a single small or private campus getting off manual lost-and-found.",
  },
  {
    key: "campus",
    name: "Campus",
    maxStudents: 15000, // 3,001 - 15,000 students
    monthlyPrice: 449,
    segment: "medium_private",
    blurb: "For a mid-size campus that needs search, filtering, and reporting.",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    maxStudents: Infinity, // 15,001+ students
    monthlyPrice: 999,
    segment: "large_public",
    blurb: "For large public university systems running multiple campuses.",
  },
];

// Ownership is the one thing a user picks by hand. Size (small/medium/large)
// is derived automatically from students per campus below, so a scenario
// never needs more than one manual segment input.
export const OWNERSHIPS = [
  { key: "private", name: "Private" },
  { key: "public", name: "Public" },
];

/**
 * The public monthly price for a tier, with the private premium applied on
 * top when ownership is "private". Rounded to a whole dollar since this is
 * a simulator, not a real invoice with cents.
 */
export function getPricePerCampus(tier, ownership) {
  const base = tier.monthlyPrice;
  return ownership === "private" ? Math.round(base * (1 + PRIVATE_PREMIUM)) : base;
}

// Size buckets are aligned to the same boundaries as the pricing tiers
// (small = Starter's range, medium = Campus's range, large = Enterprise's
// range), so "size" and "tier" always agree instead of using a second,
// arbitrary set of numbers.
const SMALL_MAX_STUDENTS = TIERS[0].maxStudents; // 3,000
const MEDIUM_MAX_STUDENTS = TIERS[1].maxStudents; // 15,000

/**
 * Auto-detect campus size from students per campus. The user never sets
 * this directly — it's implied by the same number that drives the tier.
 */
export function getSizeForStudents(students) {
  const n = Number(students);
  const safe = Number.isFinite(n) && n > 0 ? n : 0;
  if (safe <= SMALL_MAX_STUDENTS) return "small";
  if (safe <= MEDIUM_MAX_STUDENTS) return "medium";
  return "large";
}

/**
 * Combine the auto-detected size with the user's ownership pick into the
 * segment key that gets saved on a scenario (e.g. "small_private").
 */
export function getSegmentKey(students, ownership) {
  return `${getSizeForStudents(students)}_${ownership}`;
}

export const SEGMENTS = [
  {
    key: "small_private",
    name: "Small / private universities",
    description:
      "A single small private campus getting off manual lost-and-found, without waiting on procurement. Usually fits Starter.",
  },
  {
    key: "small_public",
    name: "Small / public universities",
    description:
      "A single small public campus — smaller budget than a public system, but still goes through public procurement. Usually fits Starter.",
  },
  {
    key: "medium_private",
    name: "Medium / private universities",
    description:
      "A mid-size private campus that needs search, filtering, and reporting, and can move on a deal quickly. Usually fits Campus.",
  },
  {
    key: "medium_public",
    name: "Medium / public universities",
    description:
      "A mid-size public campus with the same day-to-day needs, plus a longer public-sector procurement cycle. Usually fits Campus.",
  },
  {
    key: "large_private",
    name: "Large / private university systems",
    description:
      "A private system with multiple large campuses — fewer of these exist, but they buy multi-campus deals like a public system would. Usually fits Enterprise.",
  },
  {
    key: "large_public",
    name: "Large / public university systems",
    description:
      "Many campuses and students, longer procurement cycles, need multi-campus support and integrations. Usually fits Enterprise.",
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
 * - pricePerCampus: the tier's monthly price, +15% if ownership is "private"
 * - monthlyRevenue: pricePerCampus * number of campuses
 * - annualRevenue: monthlyRevenue * 12 * (1 - ANNUAL_DISCOUNT)
 *
 * campuses is clamped to a minimum of 1 (a deal can't be for zero campuses).
 * ownership defaults to public pricing when not given.
 */
export function calculateRevenue({ studentsPerCampus, campuses, billingCycle, ownership }) {
  const tier = getTierForStudents(studentsPerCampus);
  const safeCampuses = Math.max(1, Math.round(Number(campuses) || 1));
  const pricePerCampus = getPricePerCampus(tier, ownership === "private" ? "private" : "public");
  const monthlyRevenue = pricePerCampus * safeCampuses;
  const annualRevenue = monthlyRevenue * 12 * (1 - ANNUAL_DISCOUNT);

  return {
    tier,
    campuses: safeCampuses,
    pricePerCampus,
    monthlyRevenue,
    annualRevenue,
    displayedRevenue: billingCycle === "annual" ? annualRevenue : monthlyRevenue,
  };
}
