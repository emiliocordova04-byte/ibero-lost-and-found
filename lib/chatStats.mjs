// Summary numbers for /chat/results, kept pure so they can be tested.

export function summarizeSessions(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const rated = list.filter((r) => r.rating === "up" || r.rating === "down");
  const up = rated.filter((r) => r.rating === "up").length;
  const tags = new Set(list.map((r) => r.test_tag).filter(Boolean));
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
