"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { impactFromTests, passRule, breakEvenCustomers, sanitizeRow } from "@/lib/venture.mjs";
import { HARMS } from "@/lib/ventureData.mjs";
import { TIERS } from "@/lib/pricing.mjs";

// Assumptions, all labelled on the page. Change them here and the table follows.
const FIXED_COST = 2; // domain name per month; hosting and database are on free tiers
const SALARY = 1500; // a part-time salary target per month
const SUPPORT_PER_CUSTOMER = 60; // onboarding and support cost per customer per month

export default function ImpactApp() {
  const [tests, setTests] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const { data, error: err } = await supabase.from("user_tests").select("id,tester_tag,finished_alone,minutes,baseline_minutes,trust_1_5").order("created_at");
    if (err) { setError("Could not load the user tests. Check the connection and try again."); setTests([]); return; }
    setTests((data || []).map(sanitizeRow));
  }
  useEffect(() => { load(); }, []);

  const impact = tests ? impactFromTests(tests) : null;
  const rule = tests ? passRule(tests) : null;
  const trust = tests && tests.length ? Math.round((tests.reduce((n, t) => n + (Number(t.trust_1_5) || 0), 0) / tests.length) * 10) / 10 : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <p className="eyebrow">Week 6 · Impact and viability</p>
      <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Does it help, is it safe, can it pay for itself?</h1>
      <p className="mt-3 max-w-2xl text-muted">Three honest checks. Numbers about people come from the testers; everything about money is an assumption and says so.</p>

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold">1. Practical impact</h2>
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error} <button type="button" className="underline" onClick={load}>Retry</button></p>}
        {!tests ? (
          <p className="mt-3 text-sm text-muted">Loading...</p>
        ) : impact ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <div className="card p-5 text-center"><div className="font-display text-4xl font-extrabold">{impact.withChat} min</div><div className="mt-1 text-xs uppercase tracking-wider text-muted-2">median with the chat</div></div>
            <div className="card p-5 text-center"><div className="font-display text-4xl font-extrabold">{impact.baseline} min</div><div className="mt-1 text-xs uppercase tracking-wider text-muted-2">median today (self-reported)</div></div>
            <div className="card p-5 text-center"><div className="font-display text-4xl font-extrabold">{impact.savedPct}%</div><div className="mt-1 text-xs uppercase tracking-wider text-muted-2">less time</div></div>
            <div className="card p-5 text-center"><div className="font-display text-4xl font-extrabold">{rule.finishedAlone} of {rule.total}</div><div className="mt-1 text-xs uppercase tracking-wider text-muted-2">finished alone{trust !== null ? `, trust ${trust} of 5` : ""}</div></div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No user test has both numbers yet, so no impact is shown. Nothing is estimated in its place.</p>
        )}
        <p className="mt-3 text-xs text-muted-2">Small sample: {tests ? tests.length : 0} testers, so this is evidence of direction, not a statistic. Minutes with the chat were timed by the tester; minutes today are what they said from memory.</p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold">2. Harm check</h2>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-paper-2 text-xs uppercase tracking-wider text-muted-2"><tr><th className="px-3 py-3">Risk</th><th className="px-3 py-3">What we did</th><th className="px-3 py-3">Status</th></tr></thead>
            <tbody>
              {HARMS.map((h) => (
                <tr key={h.risk} className="border-t border-line align-top">
                  <td className="px-3 py-3 font-medium">{h.risk}</td>
                  <td className="px-3 py-3 text-ink-soft">{h.mitigation}</td>
                  <td className="px-3 py-3"><span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${h.status === "done" ? "bg-ok text-white" : "bg-sun text-ink"}`}>{h.status === "done" ? "Done" : "Open, in Version 2"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted-2">Open items are on the <a className="text-brand hover:underline" href="/roadmap">Version 2 roadmap</a>.</p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold">3. Viability (simulated)</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Prices come from the pricing simulator and are not real quotes. Assumptions: ${FIXED_COST} per month fixed cost (a domain; Vercel and Supabase are on free tiers),
          ${SUPPORT_PER_CUSTOMER} per customer per month for onboarding and support, and a ${SALARY} per month part-time salary as the second target.
        </p>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-paper-2 text-xs uppercase tracking-wider text-muted-2">
              <tr><th className="px-3 py-3">Tier</th><th className="px-3 py-3">Price / month</th><th className="px-3 py-3">After support cost</th><th className="px-3 py-3">Customers to cover running cost</th><th className="px-3 py-3">Customers to also pay a ${SALARY} salary</th></tr>
            </thead>
            <tbody>
              {TIERS.map((t) => {
                const margin = t.monthlyPrice - SUPPORT_PER_CUSTOMER;
                return (
                  <tr key={t.key} className="border-t border-line">
                    <td className="px-3 py-3 font-semibold">{t.name}</td>
                    <td className="px-3 py-3">${t.monthlyPrice}</td>
                    <td className="px-3 py-3">${margin}</td>
                    <td className="px-3 py-3">{breakEvenCustomers(FIXED_COST, margin)}</td>
                    <td className="px-3 py-3">{breakEvenCustomers(FIXED_COST + SALARY, margin)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">Reading: one Campus customer already covers the running cost; about {breakEvenCustomers(FIXED_COST + SALARY, 449 - SUPPORT_PER_CUSTOMER)} Campus customers would also pay a part-time salary. Finding those customers is the real risk, not the cost of running the site.</p>
      </section>
    </div>
  );
}
