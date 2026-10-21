"use client";

// Interactive homepage demo. Runs the same rule-based extractor as /core,
// entirely in the browser (no network), and says so on screen.

import { useState } from "react";
import { extractItemDescription } from "@/lib/extractItem";

const EXAMPLES = [
  "Black Nike backpack, left in the library yesterday",
  "Perdi mis llaves azules en la cafeteria hoy",
  "Silver iPhone found near the gym this morning",
];

const FIELDS = [
  { key: "item", label: "Item" },
  { key: "category", label: "Category" },
  { key: "color", label: "Color" },
  { key: "location", label: "Place" },
  { key: "date", label: "When" },
];

export default function ItemDemo() {
  const [text, setText] = useState(EXAMPLES[0]);
  const [result, setResult] = useState(() => extractItemDescription(EXAMPLES[0]));
  const [runs, setRuns] = useState(0);

  function run(value) {
    setResult(extractItemDescription(value));
    setRuns((n) => n + 1);
  }

  function pick(example) {
    setText(example);
    run(example);
  }

  return (
    <div className="relative">
      {/* decorative luggage tag */}
      <div
        aria-hidden="true"
        className="absolute -right-3 -top-5 z-10 hidden rotate-6 rounded-lg bg-sun px-3 py-1.5 text-xs font-bold text-ink shadow-pop sm:block"
      >
        TRY IT
      </div>

      <div className="overflow-hidden rounded-3xl border-2 border-ink bg-surface shadow-hard">
        <div className="flex items-center justify-between border-b-2 border-ink bg-paper-2 px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-brand" />
            <span className="h-3 w-3 rounded-full bg-sun" />
            <span className="h-3 w-3 rounded-full bg-ok" />
          </div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            Live demo · simulated
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <label htmlFor="demo-text" className="text-sm font-semibold text-ink">
            Describe a lost or found item
          </label>
          <textarea
            id="demo-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="field mt-2 resize-none"
            placeholder="e.g. Red umbrella left in classroom B2 on Monday"
          />

          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Example descriptions">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => pick(ex)}
                className="chip cursor-pointer transition-colors hover:border-ink hover:bg-paper"
              >
                {ex.length > 30 ? ex.slice(0, 28) + "…" : ex}
              </button>
            ))}
          </div>

          <button type="button" onClick={() => run(text)} className="btn-dark mt-4 w-full">
            Extract details
          </button>

          <dl
            key={runs}
            className="rise mt-5 divide-y divide-line rounded-2xl border border-line bg-paper/60"
            aria-live="polite"
          >
            {FIELDS.map((f) => {
              const value = result[f.key];
              const missing = value === "Not detected";
              return (
                <div key={f.key} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-2">{f.label}</dt>
                  <dd className={`text-right text-sm font-semibold ${missing ? "text-muted-2" : "text-ink"}`}>
                    {value}
                  </dd>
                </div>
              );
            })}
          </dl>

          <p className="mt-3 text-xs leading-relaxed text-muted-2">
            <span className="rounded bg-sun/60 px-1.5 py-0.5 font-bold text-ink">SIMULATED</span>{" "}
            Keyword rules in plain JavaScript, not a language model. English and Spanish.{" "}
            <a href="/core" className="font-semibold text-brand underline-offset-2 hover:underline">
              Save results on /core
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
