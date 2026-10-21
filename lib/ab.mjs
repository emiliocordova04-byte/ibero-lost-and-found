// A/B assignment. Pure functions, no browser or network access, so they can be
// unit-tested with `node --test`.
//
// A visitor gets a random anonymous id once (stored in localStorage by
// lib/abClient.js). Their variant for each test is a hash of that id plus the
// test key, so:
//   - the same visitor always sees the same variant (no flicker between visits),
//   - the two tests are assigned independently of each other,
//   - there is no server round trip to decide who sees what.

export const VARIANTS = ["A", "B"];

// 32-bit FNV-1a hash. Small, fast, and well spread for short strings.
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// murmur3 finalizer: spreads every input bit across the whole 32-bit result.
// Needed because FNV-1a alone has a flaw: its lowest bit is just the parity of
// the input bytes' lowest bits, so two tests whose keys differ only by a
// constant prefix would always flip together (variant B of one test would
// always pair with variant B or always with A of the other). The test suite
// caught exactly that (test "software 1").
export function mix32(h) {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export function assignVariant(visitorId, testKey) {
  if (!visitorId || !testKey) return "A";
  return VARIANTS[mix32(hashString(`${testKey}:${visitorId}`)) % VARIANTS.length];
}

// Accepts a forced variant from the URL (for previews and demos). Returns
// "A", "B" or null when the value is missing or invalid.
export function parseForcedVariant(value) {
  const v = String(value || "").toUpperCase();
  return VARIANTS.includes(v) ? v : null;
}

export function makeVisitorId(randomFn = Math.random) {
  const chunk = () => Math.floor(randomFn() * 0xffffffff).toString(16).padStart(8, "0");
  return `v_${chunk()}${chunk()}`;
}
