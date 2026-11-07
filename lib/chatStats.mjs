// Summary numbers for /chat/results, kept pure so they can be tested.

// A real external tester tag looks like T1, T2, T3 (from /chat?test=T1).
export function isTesterTag(tag) {
  return /^T\d+$/.test(String(tag || "").toUpperCase());
}

// Statuses staff can set on /chat/results. The chat itself only ever writes
// pending_staff_review; it never claims an item was found.
export const STATUS_OPTIONS = [
  { value: "pending_staff_review", label: "Pending review" },
  { value: "found", label: "Found, waiting for pickup" },
  { value: "returned", label: "Returned to owner" },
  { value: "closed", label: "Closed, no match" },
];

export function isValidStatus(value) {
  return STATUS_OPTIONS.some((o) => o.value === value);
}

export function statusLabel(value) {
  const o = STATUS_OPTIONS.find((x) => x.value === value);
  return o ? o.label : String(value || "").replaceAll("_", " ");
}

// Staff list views: open = still needs work, resolved = returned or closed.
// Resolved reports are hidden from the default list, never deleted.
const RESOLVED = new Set(["returned", "closed"]);
export function filterByView(rows, view) {
  const list = Array.isArray(rows) ? rows : [];
  if (view === "all") return list;
  if (view === "resolved") return list.filter((r) => RESOLVED.has(r.status));
  return list.filter((r) => !RESOLVED.has(r.status));
}

export function summarizeSessions(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const rated = list.filter((r) => r.rating === "up" || r.rating === "down");
  const up = rated.filter((r) => r.rating === "up").length;
  // only real tester tags (T1, T2, ...) count; a demo or dev tag does not
  const tags = new Set(
    list.map((r) => String(r.test_tag || "").toUpperCase()).filter((t) => isTesterTag(t))
  );
  return {
    sessions: list.length,
    rated: rated.length,
    thumbsUp: up,
    thumbsUpRate: rated.length ? up / rated.length : null,
    guardrailHits: list.reduce((n, r) => n + (Number(r.guardrail_hits) || 0), 0),
    priority: list.filter((r) => r.priority).length,
    open: list.filter((r) => !RESOLVED.has(r.status)).length,
    resolved: list.filter((r) => RESOLVED.has(r.status)).length,
    returned: list.filter((r) => r.status === "returned").length,
    userTests: tags.size,
  };
}
