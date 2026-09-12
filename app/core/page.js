"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { extractItemDescription } from "@/lib/extractItem";

const FIELDS = [
  { key: "item", label: "Item" },
  { key: "category", label: "Category" },
  { key: "color", label: "Color" },
  { key: "location", label: "Location" },
  { key: "date", label: "Date/Time reported" },
];

export default function Core() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState("");

  async function loadRecent() {
    setLoadingRecent(true);
    const { data, error } = await supabase
      .from("core_outputs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    if (!error && data) setRecent(data);
    setLoadingRecent(false);
  }

  useEffect(() => {
    loadRecent();
  }, []);

  function handleExtract() {
    setSaveMsg("");
    setResult(extractItemDescription(text));
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    setSaveMsg("");
    const { error } = await supabase.from("core_outputs").insert({
      raw_description: text,
      item: result.item,
      category: result.category,
      color: result.color,
      location: result.location,
      item_date: result.date,
    });
    setSaving(false);
    if (error) {
      setSaveMsg("Could not save: " + error.message);
    } else {
      setSaveMsg("Saved ✅");
      loadRecent();
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Delete all recent extractions? This can't be undone.")) return;
    setClearing(true);
    setClearMsg("");
    // No column value narrows this to "everything", which is the point —
    // .not("id", "is", null) just gives PostgREST an explicit filter to run.
    const { error } = await supabase.from("core_outputs").delete().not("id", "is", null);
    setClearing(false);
    if (error) {
      setClearMsg("Could not clear: " + error.message);
    } else {
      loadRecent();
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-4">Item Description Extractor</h1>
      <p className="text-gray-600 mb-8">
        Describe a lost or found item in your own words — English or Spanish — and
        this tool will pull out the structured details (item, category, color,
        location and date). The extraction is a simple rule-based simulation, not a
        real AI model.
      </p>

      <label htmlFor="description" className="block text-sm font-medium mb-2">
        Free-text description
      </label>
      <textarea
        id="description"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Found a black backpack near the cafeteria this morning"
        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
      />

      <button
        onClick={handleExtract}
        disabled={!text.trim()}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-700"
      >
        Extract
      </button>

      {result && (
        <div className="border border-gray-200 rounded-xl p-5 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Extraction result</h2>
            <span className="inline-block text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium tracking-wide">
              SIMULATED AI EXTRACTION
            </span>
          </div>
          <dl className="divide-y divide-gray-100">
            {FIELDS.map((f) => (
              <div key={f.key} className="flex justify-between py-2 text-sm">
                <dt className="text-gray-500">{f.label}</dt>
                <dd
                  className={
                    result[f.key] === "Not detected"
                      ? "text-gray-400 italic"
                      : "text-white font-medium"
                  }
                >
                  {result[f.key]}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {saveMsg && <span className="text-sm text-gray-500">{saveMsg}</span>}
          </div>
        </div>
      )}

      <div className="mt-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent extractions</h2>
          <button
            onClick={handleClearAll}
            disabled={clearing || loadingRecent || recent.length === 0}
            className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clearing ? "Clearing…" : "Clear all"}
          </button>
        </div>
        {clearMsg && <p className="text-sm text-red-600 mb-3">{clearMsg}</p>}
        {loadingRecent ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-gray-500">No extractions saved yet.</p>
        ) : (
          <div className="space-y-4">
            {recent.map((row) => (
              <div key={row.id} className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium tracking-wide">
                    SIMULATED AI EXTRACTION
                  </span>
                  {row.created_at && (
                    <span className="text-xs text-gray-400">
                      {new Date(row.created_at).toLocaleString()}
                    </span>
                  )}
                </div>
                {row.raw_description && (
                  <p className="text-sm text-gray-500 italic mb-3">
                    “{row.raw_description}”
                  </p>
                )}
                <ul className="text-sm space-y-1 text-white">
                  <li>
                    <span className="text-gray-500">Item:</span> {row.item || "Not detected"}
                  </li>
                  <li>
                    <span className="text-gray-500">Category:</span> {row.category || "Not detected"}
                  </li>
                  <li>
                    <span className="text-gray-500">Color:</span> {row.color || "Not detected"}
                  </li>
                  <li>
                    <span className="text-gray-500">Location:</span> {row.location || "Not detected"}
                  </li>
                  <li>
                    <span className="text-gray-500">Date/Time reported:</span> {row.item_date || "Not detected"}
                  </li>
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
