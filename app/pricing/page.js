"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  TIERS,
  SEGMENTS,
  OWNERSHIPS,
  ANNUAL_DISCOUNT,
  getTierForStudents,
  getSizeForStudents,
  getSegmentKey,
  calculateRevenue,
} from "@/lib/pricing.mjs";

const EMPTY_SCENARIO_NAME = "";
const SIZE_LABEL = { small: "Small", large: "Large" };
const INPUT_CLASS =
  "w-full border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2";

// A representative students-per-campus number for each tier, used when a
// tier card is clicked so the calculator below fills in with something
// realistic for that plan instead of an empty/arbitrary number. The
// recommended tier and everything downstream still recompute automatically
// from whatever number ends up in the field, same as typing it by hand.
const TIER_SAMPLE_STUDENTS = {
  starter: 1500,
  campus: 8000,
  enterprise: 20000,
};

export default function Pricing() {
  const [scenarioName, setScenarioName] = useState(EMPTY_SCENARIO_NAME);
  const [studentsPerCampus, setStudentsPerCampus] = useState(5000);
  const [campuses, setCampuses] = useState(1);
  const [ownership, setOwnership] = useState(OWNERSHIPS[0].key);
  const [billingCycle, setBillingCycle] = useState("monthly"); // scenario toggle

  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const calculatorRef = useRef(null);

  async function loadScenarios() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pricing_scenarios")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setScenarios(data);
    setLoading(false);
  }

  useEffect(() => {
    loadScenarios();
  }, []);

  const result = useMemo(
    () => calculateRevenue({ studentsPerCampus, campuses, billingCycle }),
    [studentsPerCampus, campuses, billingCycle]
  );

  const recommendedTier = useMemo(
    () => getTierForStudents(studentsPerCampus),
    [studentsPerCampus]
  );

  // Size (small/large) is never picked by hand — it's implied by students
  // per campus, the same number that drives the tier.
  const size = useMemo(
    () => getSizeForStudents(studentsPerCampus),
    [studentsPerCampus]
  );

  const segment = useMemo(
    () => getSegmentKey(studentsPerCampus, ownership),
    [studentsPerCampus, ownership]
  );

  function handleTierClick(tierKey) {
    setStudentsPerCampus(TIER_SAMPLE_STUDENTS[tierKey] ?? studentsPerCampus);
    calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!scenarioName.trim()) {
      setSaveMsg("Enter a university name before saving.");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    const { error } = await supabase.from("pricing_scenarios").insert({
      scenario_name: scenarioName.trim(),
      segment,
      tier: result.tier.key,
      students_per_campus: Number(studentsPerCampus) || 0,
      campuses: result.campuses,
      billing_cycle: billingCycle,
      monthly_revenue: result.monthlyRevenue,
      annual_revenue: result.annualRevenue,
    });
    setSaving(false);
    if (error) {
      setSaveMsg(`Couldn't save: ${error.message}`);
    } else {
      setSaveMsg("Scenario saved.");
      setScenarioName(EMPTY_SCENARIO_NAME);
      loadScenarios();
    }
  }

  async function handleDelete(id) {
    await supabase.from("pricing_scenarios").delete().eq("id", id);
    loadScenarios();
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Pricing simulator</h1>
      <p className="text-gray-400 mb-2">
        Simulated pricing for selling Ibero Lost & Found to a university —
        not a real checkout. See{" "}
        <a href="/product" className="text-blue-400 hover:underline">
          /product
        </a>{" "}
        for the full feature map.
      </p>
      <p className="text-xs text-gray-500 mb-10">
        All amounts are simulated in US dollars (USD).
      </p>

      {/* 3 pricing tier cards — click one to try it in the calculator below */}
      <section className="grid sm:grid-cols-3 gap-6 mb-12">
        {TIERS.map((t) => {
          const isRecommended = t.key === recommendedTier.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTierClick(t.key)}
              className={`text-left border rounded-xl p-5 transition-colors cursor-pointer hover:border-blue-500 ${
                isRecommended
                  ? "border-blue-500 ring-1 ring-blue-500 bg-blue-950/40"
                  : "border-gray-800 bg-gray-900/40"
              }`}
            >
              {isRecommended && (
                <span className="inline-block text-xs font-medium text-blue-400 mb-2">
                  Matches your input below
                </span>
              )}
              <h3 className="font-semibold mb-1">{t.name}</h3>
              <p className="text-2xl font-bold mb-1 text-gray-100">
                ${t.monthlyPrice}
                <span className="text-sm font-normal text-gray-500">
                  {" "}
                  USD/mo
                </span>
              </p>
              <p className="text-xs text-gray-500 mb-3">
                {t.maxStudents === Infinity
                  ? "15,000+ students"
                  : `Up to ${t.maxStudents.toLocaleString()} students`}
              </p>
              <p className="text-sm text-gray-400">{t.blurb}</p>
              <p className="text-xs text-blue-400 mt-3">
                Click to try this plan in the calculator ↓
              </p>
            </button>
          );
        })}
      </section>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Revenue calculator */}
        <section
          ref={calculatorRef}
          className="border border-gray-800 rounded-xl p-6 scroll-mt-6"
        >
          <h2 className="text-lg font-semibold mb-4">Revenue calculator</h2>

          <form onSubmit={handleSave}>
            <label className="block text-sm font-medium mb-1">
              University name
            </label>
            <input
              type="text"
              placeholder="e.g. UNAM, Tec de Monterrey…"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className={`${INPUT_CLASS} mb-4 text-sm`}
            />

            <label className="block text-sm font-medium mb-1">
              Students per campus
            </label>
            <input
              type="number"
              min="1"
              value={studentsPerCampus}
              onChange={(e) => setStudentsPerCampus(e.target.value)}
              className={`${INPUT_CLASS} mb-1`}
            />
            <p className="text-xs text-gray-500 mb-4">
              Auto-detected size:{" "}
              <strong className="text-gray-300">
                {SIZE_LABEL[size]} campus
              </strong>{" "}
              (based on students per campus above)
            </p>

            <label className="block text-sm font-medium mb-1">
              Number of campuses in the deal
            </label>
            <input
              type="number"
              min="1"
              value={campuses}
              onChange={(e) => setCampuses(e.target.value)}
              className={`${INPUT_CLASS} mb-4`}
            />

            <label className="block text-sm font-medium mb-1">
              Ownership
            </label>
            <select
              value={ownership}
              onChange={(e) => setOwnership(e.target.value)}
              className={`${INPUT_CLASS} mb-4`}
            >
              {OWNERSHIPS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.name}
                </option>
              ))}
            </select>

            {/* Scenario toggle: monthly vs annual billing */}
            <label className="block text-sm font-medium mb-2">
              Billing cycle
            </label>
            <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden mb-6">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 text-sm ${
                  billingCycle === "monthly"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-900 text-gray-300"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-2 text-sm ${
                  billingCycle === "annual"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-900 text-gray-300"
                }`}
              >
                Annual (-{Math.round(ANNUAL_DISCOUNT * 100)}%)
              </button>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-1">
                Recommended tier: <strong className="text-gray-200">{result.tier.name}</strong> · $
                {result.pricePerCampus} USD/mo per campus × {result.campuses}{" "}
                campus{result.campuses > 1 ? "es" : ""}
              </p>
              <p className="text-2xl font-bold text-gray-100">
                ${result.displayedRevenue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
                <span className="text-sm font-normal text-gray-500">
                  {" "}
                  USD / {billingCycle === "annual" ? "year" : "month"}
                </span>
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60 hover:bg-blue-700"
            >
              {saving ? "Saving…" : "Save scenario"}
            </button>
            {saveMsg && (
              <p className="text-xs text-gray-500 mt-2">{saveMsg}</p>
            )}
          </form>
        </section>

        {/* Assumptions — kept short on purpose since the tier cards above
            already show each plan's price; this only covers what isn't
            already visible there. */}
        <section className="border border-gray-800 rounded-xl p-6 h-fit">
          <h2 className="text-lg font-semibold mb-4">Assumptions</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="py-2 text-gray-500">Annual discount</td>
                <td className="py-2 text-right font-medium text-gray-100">
                  {Math.round(ANNUAL_DISCOUNT * 100)}% off the monthly rate
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">Pricing basis</td>
                <td className="py-2 text-right font-medium text-gray-100">
                  Flat fee per campus, not per student seat
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      {/* Saved pricing scenarios */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold mb-4">Saved scenarios</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : scenarios.length === 0 ? (
          <p className="text-sm text-gray-500">
            No scenarios saved yet — build one above and save it.
          </p>
        ) : (
          <div className="overflow-x-auto border border-gray-800 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium">University</th>
                  <th className="text-left p-3 font-medium">Segment</th>
                  <th className="text-left p-3 font-medium">Tier</th>
                  <th className="text-right p-3 font-medium">Students/campus</th>
                  <th className="text-right p-3 font-medium">Campuses</th>
                  <th className="text-left p-3 font-medium">Billing</th>
                  <th className="text-right p-3 font-medium">Revenue</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => (
                  <tr key={s.id} className="border-t border-gray-800">
                    <td className="p-3 text-gray-100">{s.scenario_name}</td>
                    <td className="p-3 text-gray-100">
                      {SEGMENTS.find((seg) => seg.key === s.segment)?.name ||
                        s.segment}
                    </td>
                    <td className="p-3 capitalize text-gray-100">{s.tier}</td>
                    <td className="p-3 text-right text-gray-100">
                      {Number(s.students_per_campus).toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-gray-100">
                      {s.campuses}
                    </td>
                    <td className="p-3 capitalize text-gray-100">
                      {s.billing_cycle}
                    </td>
                    <td className="p-3 text-right text-gray-100">
                      $
                      {Number(
                        s.billing_cycle === "annual"
                          ? s.annual_revenue
                          : s.monthly_revenue
                      ).toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                      USD
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
