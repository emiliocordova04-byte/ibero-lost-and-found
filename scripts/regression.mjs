// Full-site regression: every route must answer 200 and contain its expected text.
// Usage: node scripts/regression.mjs [baseUrl]
import { ALL_ROUTES } from "../lib/venture.mjs";

const base = (process.argv[2] || "https://ibero-lost-and-found.vercel.app").replace(/\/$/, "");
const EXPECT = {
  "/": "Lost", "/demo": "Guided demo", "/chat": "Lost", "/dashboard": "Dashboard", "/agents": "Agent",
  "/product": "Product", "/pricing": "Pricing", "/marketing": "Marketing", "/research": "Research",
  "/docs": "Prompt library", "/impact": "Impact", "/roadmap": "roadmap", "/chat/results": "Staff", "/core": "extract",
};

const rows = [];
for (const route of ALL_ROUTES) {
  const url = base + route;
  let status = 0, ok = false, note = "";
  try {
    const r = await fetch(url, { redirect: "follow" });
    status = r.status;
    const html = await r.text();
    const want = EXPECT[route];
    ok = status === 200 && (!want || html.toLowerCase().includes(want.toLowerCase()));
    if (status === 200 && !ok) note = `missing text "${want}"`;
  } catch (e) { note = String(e.message || e); }
  rows.push({ route, status, ok, note });
  console.log(`${ok ? "PASS" : "FAIL"}  ${String(status).padStart(3)}  ${route}${note ? "  " + note : ""}`);
}
const failed = rows.filter((r) => !r.ok).length;
console.log(`\n${rows.length - failed} of ${rows.length} routes passed on ${base} at ${new Date().toISOString()}`);
console.log(JSON.stringify({ runAt: new Date().toISOString(), url: base, results: rows }));
process.exit(failed ? 1 : 0);
