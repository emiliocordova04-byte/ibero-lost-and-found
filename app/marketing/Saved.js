"use client";

import { useState } from "react";
import { toCsv } from "@/lib/exporters.mjs";
import { CopyButton, Section, Badge, useAssets, downloadFile } from "./ui";

export function SavedSection() {
  const { saved, loading, error, remove, refresh } = useAssets();
  const [confirmId, setConfirmId] = useState(null);

  return (
    <Section
      id="saved"
      num="8"
      title="Saved marketing assets"
      intro="Anything you save above is written to the marketing_assets table in Supabase and loads back here, so the kit survives a refresh."
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={refresh} disabled={loading} className="btn-ghost btn-sm">
          {loading ? "Loading..." : "Refresh"}
        </button>
        <button
          type="button"
          disabled={saved.length === 0}
          className="btn-ghost btn-sm"
          onClick={() => downloadFile("saved-marketing-assets.json", JSON.stringify(saved, null, 2), "application/json")}
        >
          Export JSON
        </button>
        <button
          type="button"
          disabled={saved.length === 0}
          className="btn-ghost btn-sm"
          onClick={() =>
            downloadFile(
              "saved-marketing-assets.csv",
              toCsv(["created_at", "asset_type", "title", "channel", "day_number", "body"], saved),
              "text/csv"
            )
          }
        >
          Export CSV
        </button>
        <span className="text-sm text-muted">{saved.length} saved</span>
      </div>

      {error && <div className="mb-5 rounded-xl border border-danger/40 bg-danger/5 p-4 text-sm text-danger">{error}</div>}

      {!error && saved.length === 0 && !loading && (
        <div className="card border-dashed p-8 text-center text-muted">
          Nothing saved yet. Press <strong className="text-ink">Save</strong> on any post, script, headline or calendar day above.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {saved.map((s) => (
          <article key={s.id} className="card flex flex-col p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <Badge tone="navy">{s.asset_type}</Badge>
                {s.channel && <Badge>{s.channel}</Badge>}
                {s.day_number && <Badge tone="sun">Day {s.day_number}</Badge>}
              </div>
              <span className="text-xs text-muted-2">{new Date(s.created_at).toLocaleDateString()}</span>
            </div>
            <h3 className="mt-3 font-bold leading-snug">{s.title}</h3>
            <pre className="mt-2 line-clamp-5 flex-1 whitespace-pre-wrap font-sans text-sm text-muted">{s.body}</pre>
            <div className="mt-4 flex items-center gap-2">
              <CopyButton text={s.body} />
              {confirmId === s.id ? (
                <>
                  <button type="button" className="btn btn-sm bg-danger text-white" onClick={() => { remove(s.id); setConfirmId(null); }}>
                    Confirm delete
                  </button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setConfirmId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="button" className="btn-ghost btn-sm" onClick={() => setConfirmId(s.id)}>
                  Delete
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
