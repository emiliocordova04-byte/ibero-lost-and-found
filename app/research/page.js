"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const REGIONS = ["All", "Global", "Mexico", "Generic"];
const TYPES = ["All", "SaaS", "Manual/Physical", "Consumer App", "Social/Informal"];

const EMPTY_FORM = {
  name: "",
  region: "Global",
  type: "SaaS",
  digital_score: 5,
  campus_score: 5,
  notes: "",
  source_url: "",
};

export default function Research() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  async function loadEntries() {
    setLoading(true);
    const { data, error } = await supabase
      .from("research_entries")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setEntries(data);
    setLoading(false);
  }

  useEffect(() => {
    loadEntries();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      const matchesSearch =
        !q ||
        e.name?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q);
      const matchesRegion = regionFilter === "All" || e.region === regionFilter;
      const matchesType = typeFilter === "All" || e.type === typeFilter;
      return matchesSearch && matchesRegion && matchesType;
    });
  }, [entries, search, regionFilter, typeFilter]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setSaveMsg("");
    const { error } = await supabase.from("research_entries").insert({
      name: form.name,
      region: form.region,
      type: form.type,
      digital_score: Number(form.digital_score),
      campus_score: Number(form.campus_score),
      notes: form.notes,
      source_url: form.source_url,
    });
    setSaving(false);
    if (error) {
      setSaveMsg("Could not save: " + error.message);
    } else {
      setSaveMsg("Saved ✅");
      setForm(EMPTY_FORM);
      loadEntries();
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-4">Research + Benchmarking</h1>
      <p className="text-gray-600 mb-10 max-w-3xl">
        Before building more of Ibero Lost &amp; Found, this page maps who else is
        solving (or not solving) the lost-and-found problem — global software,
        Mexican universities, and informal substitutes like WhatsApp groups —
        so we can see where the real gap is.
      </p>

      {/* Intake form */}
      <div className="border border-gray-200 rounded-xl p-5 mb-10">
        <h2 className="font-semibold mb-4">Add a competitor / substitute</h2>
        <form onSubmit={handleAdd} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              placeholder="e.g. RepoApp"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Source URL</label>
            <input
              value={form.source_url}
              onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Region</label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            >
              {REGIONS.slice(1).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            >
              {TYPES.slice(1).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Digital score (0 manual – 10 fully digital)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={form.digital_score}
              onChange={(e) => setForm({ ...form, digital_score: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Campus-specific score (0 generic – 10 campus-only)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={form.campus_score}
              onChange={(e) => setForm({ ...form, campus_score: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-500 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              placeholder="What is it, and what's the gap?"
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              {saving ? "Saving…" : "Add entry"}
            </button>
            {saveMsg && <span className="text-sm text-gray-500">{saveMsg}</span>}
          </div>
        </form>
      </div>

      {/* Filter / search */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or notes…"
          className="border border-gray-300 rounded-lg p-2 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 text-sm"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 text-sm"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 mb-10">
          No entries match. Try clearing the filters.
        </p>
      ) : (
        <div className="overflow-x-auto mb-12">
          <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left p-3 font-semibold">Name</th>
                <th className="text-left p-3 font-semibold">Region</th>
                <th className="text-left p-3 font-semibold">Type</th>
                <th className="text-left p-3 font-semibold">Digital</th>
                <th className="text-left p-3 font-semibold">Campus-specific</th>
                <th className="text-left p-3 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-gray-100">
                  <td className="p-3 font-medium">{e.name}</td>
                  <td className="p-3">{e.region}</td>
                  <td className="p-3">{e.type}</td>
                  <td className="p-3">{e.digital_score}/10</td>
                  <td className="p-3">{e.campus_score}/10</td>
                  <td className="p-3">
                    {e.source_url ? (
                      <a
                        href={e.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Link
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Benchmark cards */}
      {filtered.length > 0 && (
        <div className="mb-14">
          <h2 className="text-xl font-semibold mb-4">Benchmark cards</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((e) => (
              <div key={e.id} className="border border-gray-200 rounded-xl p-4">
                <div className="font-semibold mb-1">{e.name}</div>
                <div className="text-xs text-gray-500 mb-3">
                  {e.region} · {e.type}
                </div>
                <div className="text-xs text-gray-500 mb-1">Digital</div>
                <div className="h-2 bg-gray-100 rounded-full mb-2">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${e.digital_score * 10}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mb-1">Campus-specific</div>
                <div className="h-2 bg-gray-100 rounded-full mb-3">
                  <div
                    className="h-2 bg-purple-500 rounded-full"
                    style={{ width: `${e.campus_score * 10}%` }}
                  />
                </div>
                {e.notes && <p className="text-xs text-gray-500">{e.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk map */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Risk map</h2>
        <p className="text-sm text-gray-500 mb-4">
          Digital (x-axis) vs. campus-specific (y-axis). The empty top-right
          corner — digital AND campus-specific — is the gap Ibero Lost &amp;
          Found fills.
        </p>
        <div className="relative border border-gray-200 rounded-xl h-80 bg-gray-50 overflow-hidden">
          {[0, 2, 4, 6, 8, 10].map((v) => (
            <div
              key={"v" + v}
              className="absolute top-0 bottom-0 border-l border-gray-100"
              style={{ left: `${v * 10}%` }}
            />
          ))}
          {[0, 2, 4, 6, 8, 10].map((v) => (
            <div
              key={"h" + v}
              className="absolute left-0 right-0 border-t border-gray-100"
              style={{ bottom: `${v * 10}%` }}
            />
          ))}
          <span className="absolute bottom-1 left-2 text-[10px] font-medium text-gray-600">Manual</span>
          <span className="absolute bottom-1 right-2 text-[10px] font-medium text-gray-600">Digital</span>
          <span className="absolute top-1 left-2 text-[10px] font-medium text-gray-600">Campus-specific</span>
          <span className="absolute bottom-6 left-2 text-[10px] font-medium text-gray-600">Generic</span>

          {filtered.map((e) => {
            const clamp = (n) => Math.max(3, Math.min(97, n));
            return (
              <div
                key={e.id}
                title={`${e.name} (digital ${e.digital_score}, campus ${e.campus_score})`}
                className="absolute w-3 h-3 rounded-full bg-gray-700 -translate-x-1/2 translate-y-1/2"
                style={{
                  left: `${clamp(e.digital_score * 10)}%`,
                  bottom: `${clamp(e.campus_score * 10)}%`,
                }}
              />
            );
          })}
          <div
            title="Ibero Lost & Found (this project)"
            className="absolute w-4 h-4 rounded-full bg-blue-600 ring-2 ring-white -translate-x-1/2 translate-y-1/2"
            style={{ left: "97%", bottom: "97%" }}
          />
        </div>
      </div>
    </div>
  );
}
