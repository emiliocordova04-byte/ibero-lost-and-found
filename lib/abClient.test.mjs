// Tests for the browser-side event logger in lib/abClient.js, run in Node with
// a fake window, a fake localStorage and a fake fetch (no network).
import test from "node:test";
import assert from "node:assert/strict";

function setup(fetchImpl) {
  const store = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
    },
    location: { search: "" },
  };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
  const calls = [];
  globalThis.fetch = (url, opts) => {
    calls.push({ url, opts });
    return fetchImpl(calls.length);
  };
  return { store, calls };
}
const tick = () => new Promise((r) => setTimeout(r, 10));

test("software 11: a failed request is retried later, a successful one is sent only once", async () => {
  // First attempt fails (for example the database is paused), the next works.
  const { calls } = setup((n) =>
    n === 1 ? Promise.reject(new Error("network down")) : Promise.resolve({ ok: true })
  );
  const { logAbEvent } = await import("./abClient.js");
  logAbEvent("hero_headline", "A", "impression");
  await tick();
  logAbEvent("hero_headline", "A", "impression"); // retry after the failure
  await tick();
  logAbEvent("hero_headline", "A", "impression"); // already stored: must not send
  await tick();
  assert.equal(calls.length, 2, "one failed attempt plus one successful retry, then nothing");
});

test("software 12: the same event fired twice at once is sent once", async () => {
  const { calls } = setup(() => new Promise((r) => setTimeout(() => r({ ok: true }), 5)));
  const { logAbEvent } = await import("./abClient.js");
  logAbEvent("cta_label", "B", "click");
  logAbEvent("cta_label", "B", "click");
  await tick();
  assert.equal(calls.length, 1);
  const body = JSON.parse(calls[0].opts.body);
  assert.equal(body.test_key, "cta_label");
  assert.equal(body.variant, "B");
  assert.equal(body.event, "click");
  assert.match(calls[0].url, /on_conflict=test_key,visitor_id,event/);
});
