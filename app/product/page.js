import { TIERS, SEGMENTS, FEATURES } from "@/lib/pricing.mjs";

export const metadata = {
  title: "Product — Ibero Lost & Found",
};

export default function Product() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold sm:text-5xl mb-2">Product architecture</h1>
      <p className="text-muted mb-12">
        How Ibero Lost & Found turns from a single-campus tool into something
        a university buys: who it's for, and what each tier unlocks. See{" "}
        <a href="/pricing" className="text-brand hover:underline">
          /pricing
        </a>{" "}
        for the revenue simulator.
      </p>

      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-4">Customer segments</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {SEGMENTS.map((s) => (
            <div key={s.key} className="border border-line rounded-xl p-5">
              <h3 className="font-semibold mb-1">{s.name}</h3>
              <p className="text-sm text-muted">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-4">Pricing tiers</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {TIERS.map((t) => (
            <div key={t.key} className="border border-line rounded-xl p-5">
              <h3 className="font-semibold mb-1">{t.name}</h3>
              <p className="text-xs text-muted-2 mb-2">
                {t.maxStudents === Infinity
                  ? "15,000+ students"
                  : `Up to ${t.maxStudents.toLocaleString()} students`}
              </p>
              <p className="text-sm text-muted">{t.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Product feature map</h2>
        <div className="overflow-x-auto border border-line rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="text-left p-3 font-medium">Feature</th>
                {TIERS.map((t) => (
                  <th key={t.key} className="text-center p-3 font-medium">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => (
                <tr key={f.key} className={i % 2 ? "bg-paper-2/60" : ""}>
                  <td className="p-3">{f.label}</td>
                  {TIERS.map((t) => (
                    <td key={t.key} className="text-center p-3">
                      {f.tiers.includes(t.key) ? (
                        <span className="text-ok">✓</span>
                      ) : (
                        <span className="text-muted-2">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-2 mt-3">
          Scope cut this week: no admin dashboard for managing subscriptions —
          this page and /pricing are a simulator, not a billing system.
        </p>
      </section>
    </div>
  );
}
