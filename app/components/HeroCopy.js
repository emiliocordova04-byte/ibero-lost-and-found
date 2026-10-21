"use client";

// Hero headline + calls to action. This is where the two live A/B tests run:
//   test 1  hero_headline  (headline A vs B)
//   test 2  cta_label      (primary button label A vs B)
// Variants are assigned from the visitor's anonymous id (lib/ab.mjs) and each
// visitor's impression and click are logged once to Supabase (lib/abClient.js).
// Preview a variant without logging with /?ab_hero_headline=B&ab_cta_label=B

import { useEffect, useState } from "react";
import { AB_TESTS, LANDING_COPY, getTest } from "@/lib/marketingContent.mjs";
import { resolveVariant, logAbEvent } from "@/lib/abClient";

const HEADLINE = getTest("hero_headline");
const CTA = getTest("cta_label");

export default function HeroCopy() {
  // Server render and first paint use variant A; after mount we swap to the
  // visitor's real variant. Opacity hides the swap so there is no flash.
  const [state, setState] = useState({ ready: false, headline: "A", cta: "A", forced: false });

  useEffect(() => {
    const h = resolveVariant(HEADLINE.key);
    const c = resolveVariant(CTA.key);
    setState({ ready: true, headline: h.variant, cta: c.variant, forced: h.forced || c.forced });
    if (!h.forced) logAbEvent(HEADLINE.key, h.variant, "impression");
    if (!c.forced) logAbEvent(CTA.key, c.variant, "impression");
  }, []);

  function onPrimaryClick() {
    if (state.forced) return;
    logAbEvent(HEADLINE.key, state.headline, "click");
    logAbEvent(CTA.key, state.cta, "click");
  }

  const fade = state.ready ? "ab-ready" : "ab-pending";

  return (
    <div>
      <p className="eyebrow">
        <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-brand" />
        {LANDING_COPY.eyebrow}
      </p>

      <h1
        data-ab-test="hero_headline"
        data-ab-variant={state.headline}
        className={`mt-5 text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl lg:text-[4.1rem] ${fade}`}
      >
        {HEADLINE.variants[state.headline]}
      </h1>

      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{LANDING_COPY.subhead}</p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href="/pricing"
          onClick={onPrimaryClick}
          data-ab-test="cta_label"
          data-ab-variant={state.cta}
          className={`btn-primary px-7 py-3.5 text-base ${fade}`}
        >
          {CTA.variants[state.cta]}
          <span aria-hidden="true">→</span>
        </a>
        <a href="#demo" className="btn-ghost px-7 py-3.5 text-base">
          {LANDING_COPY.secondaryCta}
        </a>
      </div>

      <p className="mt-5 text-xs text-muted-2">
        {LANDING_COPY.statusNote}
        {state.forced && (
          <span className="ml-2 rounded-full bg-sun px-2 py-0.5 font-semibold text-ink">
            A/B preview: not counted
          </span>
        )}
      </p>
    </div>
  );
}
