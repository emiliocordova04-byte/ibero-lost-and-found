// Summary numbers for /chat/results, kept pure so they can be tested.

// A real external tester tag looks like T1, T2, T3 (from /chat?test=T1).
export function isTesterTag(tag) {
  return /^T\d+$/.test(String(tag || "").toUpperCase());
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
    userTests: tags.size,
  };
}
