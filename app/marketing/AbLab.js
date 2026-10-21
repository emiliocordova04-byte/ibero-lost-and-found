"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AB_TESTS } from "@/lib/marketingContent.mjs";
import { summarizeTest, verdictFor } from "@/lib/abstats.mjs";
import { scoreHeadline } from "@/lib/headlineScore.mjs";
import { Section, Badge, CopyButton, SaveButton } from "./ui";

const MIN_PER_VARIANT = 30;

function fmtPct(x) {
  return `${(x * 100).toFixed(1)}%`;
}
function fmtP(p) {
  return p < 0.001 ? "< 0.001" : p.toFixed(3);
}
function fmtLift(l) {
  if (!Number.isFinite(l)) return "n/a";
  return `${l >= 0 ? "+" : ""}${(l * 100).toFixed(0)}%`;
}

async function fetchEvents() {
  const rows = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await supabase
      .from("ab_events")
      .select("test_key,variant,event,visitor_id")
      .order("created_at", { ascending: true })
      .range(from, from + 999);
    if (error) return { error };
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return { rows };
}

function VerdictLine({ verdict, summary }) {
  const a = summary.A.impressions;
  const b = summary.B.impressions;
  if (verdict.status === "no_data")
    return <p className="text-sm text-muted">No visitors recorded yet. Open the homepage in a few browsers or send the link to classmates to start collecting.</p>;
  if (verdict.status === "insufficient")
    return (
      <p className="text-sm text-muted">
        <strong className="text-ink">Not enough data yet.</strong> Each variant needs at least {MIN_PER_VARIANT} visitors
        before the difference means anything (now A {a}, B {b}). Treat any gap as noise.
      </p>
    );
  if (verdict.status === "significant")
    return (
      <p className="text-sm text-ink">
        <strong className="text-ok">Variant {verdict.winner} wins</strong> with a {fmtLift(Math.abs(verdict.lift))} difference
        (p = {fmtP(verdict.p)}).
      </p>
    );
  return (
    <p className="text-sm text-muted">
      <strong className="text-ink">No reliable difference yet</strong> (p = {fmtP(verdict.p)}). More visitors are needed to separate the variants.
    </p>
  );
}

function TestCard({ test, events }) {
  const summary = useMemo(() => summarizeTest(events, test.key), [events, test.key]);
  const verdict = useMemo(() => verdictFor(summary, { minPerVariant: MIN_PER_VARIANT }), [summary]);
  const maxRate = Math.max(summary.A.rate, summary.B.rate, 0.0001);
  const winner = verdict.status === "significant" ? verdict.winner : null;

  return (
    <article className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone="brand">Live A/B test</Badge>
          <h3 className="mt-2 text-2xl font-extrabold">{test.name}</h3>
          <p className="mt-1 text-sm text-muted">{test.question}</p>
        </div>
        <p className="text-xs text-muted-2">Metric: {test.metric}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {["A", "B"].map((v) => {
          const s = summary[v];
          return (
            <div
              key={v}
              className={`rounded-2xl border-2 p-4 transition-colors ${winner === v ? "border-ok bg-ok/5" : "border-line"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-extrabold">Variant {v}</span>
                {winner === v && <Badge tone="ok">Winner</Badge>}
              </div>
              <p className="mt-2 min-h-[3rem] text-base font-semibold leading-snug">&ldquo;{test.variants[v]}&rdquo;</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-paper-2" aria-hidden="true">
                <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${(s.rate / maxRate) * 100}%` }} />
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-2">Visitors</dt>
                  <dd className="font-display text-xl font-bold">{s.impressions}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-2">Clicks</dt>
                  <dd className="font-display text-xl font-bold">{s.clicks}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-2">Click rate</dt>
                  <dd className="font-display text-xl font-bold text-brand">{fmtPct(s.rate)}</dd>
                </div>
              </dl>
              <a
                href={`/?ab_${test.key}=${v}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-xs font-semibold text-brand hover:underline"
              >
                Preview variant {v} (not counted)
              </a>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl bg-paper px-4 py-3">
        <VerdictLine verdict={verdict} summary={summary} />
        {verdict.status !== "no_data" && (
          <p className="mt-1 font-mono text-xs text-muted-2">
            lift B vs A {fmtLift(verdict.lift)} · z = {verdict.z.toFixed(2)} · p = {fmtP(verdict.p)} · two-proportion z-test
          </p>
        )}
      </div>
    </article>
  );
}

function HeadlineLab() {
  const [a, setA] = useState(AB_TESTS[0].variants.A);
  const [b, setB] = useState(AB_TESTS[0].variants.B);
  const sa = useMemo(() => scoreHeadline(a), [a]);
  const sb = useMemo(() => scoreHeadline(b), [b]);
  const lead = sa.score === sb.score ? null : sa.score > sb.score ? "A" : "B";

  const col = (label, value, setValue, s) => (
    <div className={`card p-5 ${lead === label ? "border-ok" : ""}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={`lab-${label}`} className="font-display text-lg font-bold">Headline {label}</label>
        {lead === label && <Badge tone="ok">Higher rule score</Badge>}
      </div>
      <textarea
        id={`lab-${label}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        className="field mt-3 resize-none"
      />
      <div className="mt-3 flex items-end justify-between">
        <p className="font-display text-5xl font-extrabold text-brand">{s.score}<span className="text-lg text-muted-2">/100</span></p>
        <p className="text-xs text-muted-2">{s.words} words · {s.chars} characters</p>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {s.checks.map((c) => (
          <li key={c.key} className="flex gap-2" title={c.tip}>
            <span className={c.pass ? "text-ok" : "text-danger"} aria-hidden="true">{c.pass ? "✓" : "✕"}</span>
            <span className={c.pass ? "text-ink-soft" : "text-ink"}>{c.label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <CopyButton text={value} label="Copy headline" />
        <SaveButton
          asset={{ asset_type: "headline", title: `Headline ${label}: ${value.slice(0, 50)}`, channel: null, body: `${value}\n\nRule score: ${s.score}/100`}}
        />
      </div>
    </div>
  );

  return (
    <div className="mt-10">
      <h3 className="text-2xl font-extrabold">Headline Lab</h3>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Draft two headlines and check them against the brand voice rules.{" "}
        <strong className="text-ink">This is a rule-based checker, not AI, and it does not predict real performance.</strong>{" "}
        The live tests above are what measure performance.
      </p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {col("A", a, setA, sa)}
        {col("B", b, setB, sb)}
      </div>
    </div>
  );
}

export function AbSection() {
  const [events, setEvents] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });

  const load = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const res = await fetchEvents();
      if (res.error) {
        const missing = /PGRST205|42P01|schema cache|does not exist/i.test(`${res.error.code} ${res.error.message}`);
        setState({
          loading: false,
          error: missing
            ? "The ab_events table is not in Supabase yet. Run supabase_marketing.sql once in the Supabase SQL editor."
            : res.error.message,
        });
        return;
      }
      setEvents(res.rows);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: String(e?.message || e) });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Section
      id="ab"
      num="7"
      title="A/B headline tester"
      intro="Two tests run live on the homepage at the same time. Each visitor is assigned a stable variant for each test and counted once. Results below are read straight from Supabase."
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={load} disabled={state.loading} className="btn-ghost btn-sm">
          {state.loading ? "Loading..." : "Refresh results"}
        </button>
        <span className="text-xs text-muted-2">
          Preview links add ?ab_test=A or B and are never counted. Both tests use the same click: the primary button.
        </span>
      </div>

      {state.error && (
        <div className="mb-5 rounded-xl border border-danger/40 bg-danger/5 p-4 text-sm text-danger">{state.error}</div>
      )}

      <div className="grid gap-6">
        {AB_TESTS.map((t) => (
          <TestCard key={t.key} test={t} events={events} />
        ))}
      </div>

      <HeadlineLab />
    </Section>
  );
}
