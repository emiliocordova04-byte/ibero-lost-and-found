"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { summarizeSessions, isTesterTag, filterByView, STATUS_OPTIONS, isValidStatus, statusLabel } from "@/lib/chatStats.mjs";

function Kpi({ label, value }) {
  return (
    <div className="card p-4 text-center">
      <div className="font-display text-3xl font-extrabold">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-2">{label}</div>
    </div>
  );
}

export default function ResultsApp() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);
  const [onlyTests, setOnlyTests] = useState(false);
  const [view, setView] = useState("open");
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [toast, setToast] = useState("");

  async function load() {
    setError("");
    setLoading(true);
    const { data, error: err } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (err) {
      setError("Could not load the saved sessions. Check the connection and try again.");
      setRows((old) => old || []);
      return;
    }
    setRows(data || []);
    setUpdatedAt(new Date());
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id, value) {
    if (!isValidStatus(value)) return;
    const before = rows;
    setError("");
    setToast("");
    setRows((list) => list.map((r) => (r.id === id ? { ...r, status: value } : r)));
    const { error: err } = await supabase.from("chat_sessions").update({ status: value }).eq("id", id);
    if (err) {
      setRows(before);
      setError("Could not update the status. Nothing was changed. Please try again.");
      return;
    }
    if (value === "returned" || value === "closed") {
      setToast(`Moved to "Returned and closed". Nothing was deleted. You can see it with the Returned and closed tab.`);
    }
  }

  const scoped = useMemo(() => (rows || []).filter((r) => (onlyTests ? isTesterTag(r.test_tag) : true)), [rows, onlyTests]);
  const shown = useMemo(() => filterByView(scoped, view), [scoped, view]);
  const stats = useMemo(() => summarizeSessions(scoped), [scoped]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="eyebrow">Week 5 · Staff and test summary</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Chat results</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Every confirmed report from <a className="underline hover:text-brand" href="/chat">/chat</a>, with its rating.
        Transcripts are stored with phone numbers and emails already removed. Staff change a report to found,
        returned or closed with the Status menu: returned and closed reports leave the Open list but are never deleted. Priority marks sensitive items (documents, electronics, keys) that
        staff should look at first.
      </p>
      <p className="mt-2 max-w-2xl text-xs text-muted-2">
        Demo staff view: there is no staff login yet, so anyone with this link can change a status. A login is the
        first thing to add before real use.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-ghost btn-sm" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
        {updatedAt && <span className="text-xs text-muted-2">Updated {updatedAt.toLocaleTimeString()}</span>}
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyTests} onChange={(e) => setOnlyTests(e.target.checked)} />
          Only external user tests (tags T1, T2, T3)
        </label>
      </div>

      {error && <p className="mt-4 text-danger">{error}</p>}
      {toast && <p className="mt-4 rounded-xl border border-line-strong bg-paper-2 px-4 py-2 text-sm">{toast}</p>}
      {rows === null && !error && <p className="mt-4 text-muted">Loading...</p>}

      {rows !== null && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
            <Kpi label="Sessions" value={stats.sessions} />
            <Kpi label="Rated" value={stats.rated} />
            <Kpi
              label="Thumbs up"
              value={stats.thumbsUpRate === null ? "n/a" : `${Math.round(stats.thumbsUpRate * 100)}%`}
            />
            <Kpi label="Guardrail replies" value={stats.guardrailHits} />
            <Kpi label="User tests" value={stats.userTests} />
            <Kpi label="Returned" value={stats.returned} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Report list">
            {[
              ["open", `Open (${stats.open})`],
              ["resolved", `Returned and closed (${stats.resolved})`],
              ["all", `All (${stats.sessions})`],
            ].map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={view === v ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="card mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper-2 text-xs uppercase tracking-wider text-muted-2">
                <tr>
                  <th className="px-3 py-3">When</th>
                  <th className="px-3 py-3">Item</th>
                  <th className="px-3 py-3">Place</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-3 py-3">Rating</th>
                  <th className="px-3 py-3">Test</th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted">
                      {view === "open" ? "No open reports. Reports marked returned or closed are in the Returned and closed tab." : view === "resolved" ? "Nothing returned or closed yet." : "No saved sessions yet. Finish a report in /chat and it will appear here."}
                    </td>
                  </tr>
                )}
                {shown.map((r) => (
                  <>
                    <tr
                      key={r.id}
                      className="cursor-pointer border-t border-line hover:bg-paper"
                      onClick={() => setOpen(open === r.id ? null : r.id)}
                    >
                      <td className="px-3 py-3">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-3 py-3 font-medium">{r.item}</td>
                      <td className="px-3 py-3">{r.place}</td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          className="field py-1.5 text-sm"
                          value={r.status}
                          aria-label={`Status of ${r.item}`}
                          onChange={(e) => setStatus(r.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">{r.priority ? <span className="rounded-full border border-danger px-2 py-0.5 text-xs font-semibold text-danger">Priority</span> : "-"}</td>
                      <td className="px-3 py-3">{r.rating === "up" ? "👍" : r.rating === "down" ? "👎" : "-"}</td>
                      <td className="px-3 py-3">{r.test_tag || "-"}</td>
                    </tr>
                    {open === r.id && (
                      <tr key={`${r.id}-t`} className="border-t border-line bg-paper">
                        <td colSpan={7} className="px-4 py-4 text-sm">
                          {r.feedback && (
                            <p className="mb-3">
                              <strong>Comment:</strong> {r.feedback}
                            </p>
                          )}
                          <p className="mb-2 text-xs uppercase tracking-wider text-muted-2">
                            Transcript ({r.lang === "es" ? "Spanish" : "English"}, {r.guardrail_hits} guardrail replies)
                          </p>
                          <ul className="space-y-1">
                            {(r.transcript || []).map((m, i) => (
                              <li key={i}>
                                <span className="font-semibold">{m.role === "user" ? "Student" : "Assistant"}:</span>{" "}
                                <span className="whitespace-pre-line">{m.text}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
