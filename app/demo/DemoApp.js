"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { summarizeDashboard, passRule } from "@/lib/venture.mjs";
import { TIERS } from "@/lib/pricing.mjs";
import { DEMO_INTRO } from "@/lib/ventureData.mjs";

const STEPS = [
  {
    key: "report", short: "Report", title: "A student reports a lost item",
    what: "In the chat, the student answers three short questions (what, where, when) in English or Spanish and confirms a summary.",
    why: "Reports that miss the place or the time slow staff down. A guided chat collects exactly what staff need, on a phone, in about a minute.",
    proof: (s) => (s ? `${s.reports} reports have been saved by the chat so far.` : null),
    links: [{ href: "/chat?test=DEMO", label: "Try the chat" }],
    label: "Rule-based assistant, no paid AI",
  },
  {
    key: "review", short: "Review", title: "The chat never promises anything",
    what: "Phone numbers, emails and ID numbers are removed before saving. Off-topic or unsafe messages get a safety reply. Every report is saved as pending staff review.",
    why: "A chat that guesses can promise that an item was found when it was not. Here a person always checks first.",
    proof: () => "Try it: type 'what is the weather today' and the chat will say it cannot help and ask the same question again.",
    links: [{ href: "/chat?test=DEMO", label: "Try a safety message" }],
    label: "Rule-based assistant, no paid AI",
  },
  {
    key: "staff", short: "Staff", title: "Staff decide what happens next",
    what: "Staff see every report, with a Priority flag for sensitive items like IDs, phones and keys, and change its status to found, returned or closed. Nothing is deleted.",
    why: "This is the human checkpoint of the whole venture.",
    proof: (s) => (s ? `${s.open} reports are open and ${s.returned} are returned right now.` : null),
    links: [{ href: "/chat/results", label: "Open the staff view" }],
    label: "Demo view without login",
  },
  {
    key: "dashboard", short: "Dashboard", title: "One place for every record",
    what: "The dashboard reads the records of every module: reports, A/B events, marketing assets, pricing scenarios, extractions, research and user tests.",
    why: "A buyer can see that the product is in use, not only described. Private fields are never loaded.",
    proof: (s) => (s ? `${s.reports} reports, ${s.assets} marketing assets, ${s.scenarios} pricing scenarios and ${s.research} research entries are in the database.` : null),
    links: [{ href: "/dashboard", label: "Open the dashboard" }],
    label: "Live data from Supabase",
  },
  {
    key: "agents", short: "Agents", title: "Agents do the routine work, people decide",
    what: "The map shows six agents, what each one reads and writes, its guardrail and the human checkpoint next to it.",
    why: "It makes clear what is automated, what is simulated and who is responsible.",
    proof: () => "Four of the six are rules, templates or simulators; one is a human, one is the coding agent that built the site.",
    links: [{ href: "/agents", label: "Open the agent map" }],
    label: "Rules, templates and simulators",
  },
  {
    key: "impact", short: "Impact", title: "Does it help, and is it safe and viable?",
    what: "Five external users tested the whole site. The impact page compares the time to report with the chat against the time they say it takes today, lists the harms we checked and shows how many customers it takes to break even.",
    why: "A venture needs evidence that it creates value, avoids obvious harm and can pay for itself.",
    proof: (s, rule) => (s ? `${s.externalUsers} external users are recorded; ${rule.finishedAlone} of ${rule.total} finished alone.` : null),
    links: [{ href: "/impact", label: "See the impact check" }, { href: "/roadmap", label: "See the Version 2 roadmap" }],
    label: "Measured with testers, assumptions labelled",
  },
];

export default function DemoApp() {
  const [step, setStep] = useState(0);
  const [live, setLive] = useState({ state: "loading" });

  useEffect(() => {
    let cancel = false;
    async function load() {
      const [a, b, c, d, e] = await Promise.all([
        supabase.from("chat_sessions").select("id,status,rating"),
        supabase.from("user_tests").select("id,tester_tag,finished_alone"),
        supabase.from("marketing_assets").select("id"),
        supabase.from("pricing_scenarios").select("id"),
        supabase.from("research_entries").select("id"),
      ]);
      if (cancel) return;
      if (a.error) { setLive({ state: "error" }); return; }
      const tests = b.error ? [] : b.data || [];
      setLive({
        state: "ready",
        summary: summarizeDashboard({ sessions: a.data || [], userTests: tests, assets: c.data || [], scenarios: d.data || [], research: e.data || [] }),
        rule: passRule(tests),
      });
    }
    load();
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    function onKey(ev) {
      const tag = ev.target && ev.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (ev.key === "ArrowRight") setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (ev.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const s = STEPS[step];
  const summary = live.state === "ready" ? live.summary : null;
  const rule = live.state === "ready" ? live.rule : { finishedAlone: 0, total: 0 };
  const proof = s.proof(summary, rule);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <p className="eyebrow">Week 6 · Guided demo</p>
      <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Lost something on campus? Here is the whole venture in six steps</h1>
      <p className="mt-4 max-w-2xl rounded-xl border border-line-strong bg-surface p-4 text-ink">
        <strong>In one sentence.</strong> {DEMO_INTRO}
      </p>
      <p className="mt-3 max-w-2xl text-muted">
        About five minutes. Each step explains what happens, why it matters and shows live proof from the database.
        Use the buttons or the arrow keys.
      </p>

      <ol className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Steps">
        {STEPS.map((x, i) => (
          <li key={x.key}>
            <button type="button" onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}
              className={`w-full rounded-full border px-3 py-2 text-sm font-semibold ${i === step ? "border-ink bg-ink text-white" : i < step ? "border-line-strong bg-paper-2 text-ink" : "border-line-strong bg-surface text-ink-soft"}`}>
              {i + 1} {x.short}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <section className="card p-6 sm:p-8" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-2">Step {step + 1} of {STEPS.length}{step === 0 ? " · Start here" : ""}</p>
          <h2 className="mt-1 text-3xl font-extrabold">{s.title}</h2>
          <p className="mt-4 text-ink-soft"><strong>What happens.</strong> {s.what}</p>
          <p className="mt-3 text-ink-soft"><strong>Why it matters.</strong> {s.why}</p>
          <div className="mt-5 rounded-xl border border-dashed border-line-strong bg-paper p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-2">Live proof</p>
            <p className="mt-1 text-ink">
              {live.state === "loading" ? "Loading live numbers..." : live.state === "error" ? "The live numbers are not available right now (the database could not be reached), but the page link below still works." : proof}
            </p>
          </div>
          {step === STEPS.length - 1 && (
            <div className="mt-5 rounded-xl bg-paper-2 p-4 text-sm text-ink-soft">
              <strong>That is the whole venture.</strong> Now try it yourself: report an invented item in the chat, then open the dashboard to see it appear.
            </div>
          )}
          <p className="mt-4 inline-block rounded-full bg-paper-2 px-3 py-1 text-xs font-semibold text-ink-soft">{s.label}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {s.links.map((l) => <a key={l.href} href={l.href} className="btn-primary">{l.label}</a>)}
            <button type="button" className="btn-ghost" onClick={() => setStep((v) => Math.max(v - 1, 0))} disabled={step === 0}>Back</button>
            <button type="button" className="btn-dark" onClick={() => setStep((v) => Math.min(v + 1, STEPS.length - 1))} disabled={step === STEPS.length - 1}>Next step</button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-2">Live numbers</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div><div className="font-display text-3xl font-extrabold">{summary ? summary.reports : "-"}</div><div className="text-xs text-muted-2">reports saved</div></div>
              <div><div className="font-display text-3xl font-extrabold">{summary ? summary.externalUsers : "-"}</div><div className="text-xs text-muted-2">external users</div></div>
              <div><div className="font-display text-3xl font-extrabold">{summary ? summary.returned : "-"}</div><div className="text-xs text-muted-2">returned</div></div>
              <div><div className="font-display text-3xl font-extrabold">{summary && summary.thumbsUpPct !== null ? `${summary.thumbsUpPct}%` : "-"}</div><div className="text-xs text-muted-2">thumbs up</div></div>
            </div>
          </div>
          <div className="card p-5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-2">How the business works</p>
            <p className="mt-2 text-ink-soft"><strong>Students use it free.</strong> Universities pay a monthly subscription per campus:</p>
            <ul className="mt-2 space-y-1 text-ink-soft">
              {TIERS.map((t) => <li key={t.key}>{t.name}: ${t.monthlyPrice} per month</li>)}
            </ul>
            <p className="mt-2 text-xs text-muted-2">Prices are simulated, not real quotes. <a className="text-brand hover:underline" href="/pricing">Try the simulator</a>.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
