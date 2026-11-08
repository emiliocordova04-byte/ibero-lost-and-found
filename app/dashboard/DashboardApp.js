"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { sanitizeRow, summarizeDashboard, passRule, impactFromTests } from "@/lib/venture.mjs";
import { statusLabel } from "@/lib/chatStats.mjs";
import { REGRESSION } from "@/lib/ventureData.mjs";

// Only the columns listed here are ever requested: transcripts, comments, raw text and visitor ids stay in the database.
const TABS = [
  { key: "sessions", label: "Chat reports", table: "chat_sessions", select: "id,created_at,lang,item,category,place,when_text,status,priority,rating,test_tag",
    cols: [["created_at", "When", "date"], ["item", "Item"], ["place", "Place"], ["status", "Status", "status"], ["priority", "Priority", "bool"], ["rating", "Rating"], ["test_tag", "Test"]] },
  { key: "tests", label: "User tests", table: "user_tests", select: "id,created_at,tester_tag,finished_alone,minutes,baseline_minutes,trust_1_5,quote,route_tested",
    cols: [["tester_tag", "Tester"], ["finished_alone", "Finished alone", "bool"], ["minutes", "Minutes"], ["baseline_minutes", "Minutes today"], ["trust_1_5", "Trust 1-5"], ["quote", "Quote"]] },
  { key: "ab", label: "A/B events", table: "ab_events", select: "id,created_at,test_key,variant,event",
    cols: [["created_at", "When", "date"], ["test_key", "Test"], ["variant", "Variant"], ["event", "Event"]] },
  { key: "assets", label: "Marketing assets", table: "marketing_assets", select: "id,created_at,asset_type,title,channel,day_number",
    cols: [["created_at", "When", "date"], ["asset_type", "Type"], ["title", "Title"], ["channel", "Channel"], ["day_number", "Day"]] },
  { key: "scenarios", label: "Pricing scenarios", table: "pricing_scenarios", select: "id,created_at,scenario_name,segment,tier,students_per_campus,campuses,billing_cycle,monthly_revenue,annual_revenue",
    cols: [["scenario_name", "Scenario"], ["tier", "Tier"], ["students_per_campus", "Students"], ["campuses", "Campuses"], ["monthly_revenue", "USD / month", "money"], ["annual_revenue", "USD / year", "money"]] },
  { key: "extractions", label: "Extractions", table: "core_outputs", select: "id,created_at,item,category,color,location,item_date",
    cols: [["created_at", "When", "date"], ["item", "Item"], ["category", "Category"], ["color", "Color"], ["location", "Place"]] },
  { key: "research", label: "Research", table: "research_entries", select: "id,created_at,name,region,type,digital_score,campus_score",
    cols: [["name", "Name"], ["region", "Region"], ["type", "Type"], ["digital_score", "Digital"], ["campus_score", "Campus"]] },
];

function Kpi({ label, value }) {
  return (
    <div className="card p-4 text-center">
      <div className="font-display text-3xl font-extrabold">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-2">{label}</div>
    </div>
  );
}

function fmt(v, kind) {
  if (v === null || v === undefined || v === "") return "-";
  if (kind === "date") return new Date(v).toLocaleString();
  if (kind === "bool") return v === true ? "Yes" : v === false ? "No" : "-";
  if (kind === "status") return statusLabel(v);
  if (kind === "money") return `$${Number(v).toLocaleString()}`;
  return String(v);
}

function RecordsTable({ tab, rows }) {
  if (!rows.length) {
    return <p className="card p-6 text-sm text-muted">No records yet in {tab.table}.</p>;
  }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-paper-2 text-xs uppercase tracking-wider text-muted-2">
          <tr>{tab.cols.map(([k, label]) => <th key={k} className="px-3 py-2.5 font-semibold">{label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((r, i) => (
            <tr key={r.id || i} className="border-t border-line">
              {tab.cols.map(([k, , kind]) => <td key={k} className="px-3 py-2.5">{fmt(r[k], kind)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 50 && <p className="border-t border-line px-3 py-2 text-xs text-muted-2">Showing the latest 50 of {rows.length}.</p>}
    </div>
  );
}

function TestingSummary({ tests, missing }) {
  const rule = passRule(tests);
  const impact = impactFromTests(tests);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="External users" value={new Set(tests.map((t) => t.tester_tag)).size} />
        <Kpi label="Finished alone" value={`${rule.finishedAlone} of ${rule.total}`} />
        <Kpi label="Pass rule (4 of 5)" value={rule.total === 0 ? "-" : rule.pass ? "Passed" : "Not yet"} />
      </div>
      <div className="card p-5 text-sm">
        <h3 className="font-display text-lg font-bold">Time to report an item</h3>
        {impact ? (
          <p className="mt-2 text-ink-soft">
            Median with the chat: <strong>{impact.withChat} min</strong>. Median the same people say it takes today: <strong>{impact.baseline} min</strong>
            {" "}({impact.savedMinutes} min less, {impact.savedPct}%). Minutes with the chat are measured by the tester; minutes today are self-reported.
          </p>
        ) : (
          <p className="mt-2 text-muted">{missing ? "The user_tests table has not been created yet." : "No user test with both numbers yet, so no impact is shown."}</p>
        )}
      </div>
      <div className="card overflow-x-auto">
        <h3 className="px-4 pt-4 font-display text-lg font-bold">Full-site regression</h3>
        {REGRESSION.results.length ? (
          <>
            <p className="px-4 pb-2 text-xs text-muted-2">Run on {REGRESSION.runAt} against {REGRESSION.url} with scripts/regression.mjs.</p>
            <table className="w-full text-left text-sm">
              <thead className="bg-paper-2 text-xs uppercase tracking-wider text-muted-2">
                <tr><th className="px-3 py-2.5">Route</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Check</th><th className="px-3 py-2.5">Result</th></tr>
              </thead>
              <tbody>
                {REGRESSION.results.map((r) => (
                  <tr key={r.route} className="border-t border-line">
                    <td className="px-3 py-2.5 font-mono text-xs">{r.route}</td>
                    <td className="px-3 py-2.5">{r.status}</td>
                    <td className="px-3 py-2.5">{r.check}</td>
                    <td className={`px-3 py-2.5 font-semibold ${r.ok ? "text-ok" : "text-danger"}`}>{r.ok ? "Pass" : "Fail"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="px-4 pb-4 pt-2 text-sm text-muted">The regression has not been run yet.</p>
        )}
      </div>
    </div>
  );
}

export default function DashboardApp() {
  const [data, setData] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [tab, setTab] = useState("sessions");

  async function load() {
    setLoading(true);
    const results = await Promise.all(
      TABS.map(async (t) => {
        const { data: rows, error } = await supabase.from(t.table).select(t.select).order("created_at", { ascending: false }).limit(200);
        return [t.key, error ? { error: error.message } : { rows: (rows || []).map(sanitizeRow) }];
      })
    );
    const d = {}; const e = {};
    for (const [k, v] of results) { d[k] = v.rows || []; if (v.error) e[k] = v.error; }
    setData(d); setErrors(e); setLoading(false); setUpdatedAt(new Date());
  }

  useEffect(() => { load(); }, []);

  const summary = useMemo(() => data && summarizeDashboard({
    sessions: data.sessions, abEvents: data.ab, assets: data.assets, scenarios: data.scenarios,
    extractions: data.extractions, research: data.research, userTests: data.tests,
  }), [data]);

  const allFailed = data && Object.keys(errors).length === TABS.length;
  const current = TABS.find((t) => t.key === tab);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <p className="eyebrow">Week 6 · Records</p>
      <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Dashboard</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Live records from every module of the venture. Transcripts, comments and contact data are never loaded on this page.
        Prices and AI-style results in these tables are simulated unless a row says otherwise.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button type="button" onClick={load} disabled={loading} className="btn-ghost btn-sm">{loading ? "Refreshing..." : "Refresh"}</button>
        <span className="text-xs text-muted-2">{updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : "Loading..."}</span>
      </div>

      {allFailed && (
        <div role="alert" className="mt-6 card border-danger p-5 text-sm">
          <p className="font-semibold text-danger">Could not reach the database.</p>
          <p className="mt-1 text-muted">Check the connection and try again.</p>
          <button type="button" onClick={load} className="btn-primary btn-sm mt-3">Retry</button>
        </div>
      )}

      {summary && !allFailed && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Kpi label="Chat reports" value={summary.reports} />
            <Kpi label="Returned" value={summary.returned} />
            <Kpi label="Open" value={summary.open} />
            <Kpi label="Thumbs up" value={summary.thumbsUpPct === null ? "-" : `${summary.thumbsUpPct}%`} />
            <Kpi label="External users" value={summary.externalUsers} />
            <Kpi label="A/B events" value={summary.abImpressions + summary.abClicks} />
            <Kpi label="Marketing assets" value={summary.assets} />
            <Kpi label="Pricing scenarios" value={summary.scenarios} />
            <Kpi label="Extractions" value={summary.extractions} />
            <Kpi label="Research entries" value={summary.research} />
          </div>

          <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Modules">
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${tab === t.key ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink-soft hover:border-ink"}`}>
                {t.label} ({data[t.key].length})
              </button>
            ))}
            <button type="button" role="tab" aria-selected={tab === "summary"} onClick={() => setTab("summary")}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${tab === "summary" ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink-soft hover:border-ink"}`}>
              Testing summary
            </button>
          </div>

          <div className="mt-5" role="tabpanel">
            {tab === "summary" ? (
              <TestingSummary tests={data.tests} missing={Boolean(errors.tests)} />
            ) : errors[tab] ? (
              <p role="alert" className="card p-6 text-sm text-danger">Could not load {current.table}: {errors[tab]}</p>
            ) : (
              <RecordsTable tab={current} rows={data[tab]} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
