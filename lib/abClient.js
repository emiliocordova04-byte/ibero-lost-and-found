// Browser-side A/B helpers: anonymous visitor id, variant lookup and event
// logging to the Supabase `ab_events` table.
//
// One impression and one click are recorded per visitor per test. The table
// has a unique index on (test_key, visitor_id, event) and we ask PostgREST to
// ignore duplicates, so repeat visits and double clicks never inflate counts.

import { assignVariant, makeVisitorId, parseForcedVariant } from "./ab.mjs";

const ID_KEY = "ibero_ab_visitor";

export function getVisitorId() {
  try {
    let id = window.localStorage.getItem(ID_KEY);
    if (!id) {
      id = makeVisitorId();
      window.localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked (private mode): fall back to a per-page-load id.
    return makeVisitorId();
  }
}

// ?ab_hero_headline=B forces a variant for demos. Forced views are previews
// and are never logged, so they cannot pollute the results.
export function resolveVariant(testKey) {
  const params = new URLSearchParams(window.location.search);
  const forced = parseForcedVariant(params.get(`ab_${testKey}`));
  if (forced) return { variant: forced, forced: true };
  return { variant: assignVariant(getVisitorId(), testKey), forced: false };
}

export function logAbEvent(testKey, variant, event) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    // Remember locally too so we do not even send a second request.
    const memo = `ibero_ab_${testKey}_${event}`;
    if (window.localStorage.getItem(memo)) return;
    window.localStorage.setItem(memo, "1");
    fetch(`${url}/rest/v1/ab_events?on_conflict=test_key,visitor_id,event`, {
      method: "POST",
      keepalive: true, // lets a click be recorded even as the page navigates
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify({
        test_key: testKey,
        variant,
        event,
        visitor_id: getVisitorId(),
      }),
    }).catch(() => {});
  } catch {
    /* tracking must never break the page */
  }
}
