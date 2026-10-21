import { supabase } from "@/lib/supabaseClient";
import { TIERS, FEATURES, getPricePerCampus, ANNUAL_DISCOUNT, PRIVATE_PREMIUM } from "@/lib/pricing.mjs";
import { LANDING_COPY, PRODUCT_STATUS } from "@/lib/marketingContent.mjs";
import HeroCopy from "./components/HeroCopy";
import ItemDemo from "./components/ItemDemo";

export const metadata = {
  title: "Ibero Lost & Found | Lost and found for university campuses",
};

// Without this, Next.js prerenders the page once at build time and the
// research numbers below would freeze at whatever the table held then.
export const dynamic = "force-dynamic";

const CATEGORY_MARQUEE = [
  "Keys", "Backpacks", "Laptops", "Phones", "Wallets", "Water bottles",
  "Jackets", "Headphones", "ID cards", "Umbrellas", "Notebooks", "Chargers",
];

async function getResearchStats() {
  try {
    const { data, error } = await supabase
      .from("research_entries")
      .select("region, digital_score, campus_score");
    if (error || !data) return null;
    const mexico = data.filter((e) => e.region === "Mexico");
    return {
      total: data.length,
      mexico: mexico.length,
      mexicoDigital: mexico.filter((e) => e.digital_score >= 7).length,
      campusSpecific: data.filter((e) => e.campus_score >= 7).length,
    };
  } catch {
    return null;
  }
}

function SectionHead({ eyebrow, title, children, light = false }) {
  return (
    <div className="max-w-2xl">
      <p className={`eyebrow ${light ? "!text-sun" : ""}`}>{eyebrow}</p>
      <h2 className={`mt-3 text-3xl font-extrabold leading-tight sm:text-5xl ${light ? "text-white" : ""}`}>
        {title}
      </h2>
      {children && <p className={`mt-4 text-lg ${light ? "text-white/75" : "text-muted"}`}>{children}</p>}
    </div>
  );
}

export default async function Home() {
  const stats = await getResearchStats();
  const privatePct = Math.round(PRIVATE_PREMIUM * 100);
  const annualPct = Math.round(ANNUAL_DISCOUNT * 100);

  return (
    <>
      {/* HERO */}
      <section className="bg-grid relative overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sun/40 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <HeroCopy />
          <div id="demo" className="scroll-mt-24">
            <ItemDemo />
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden border-b border-line bg-ink py-3.5 text-white" aria-hidden="true">
        <div className="ticker-track flex w-max gap-10 whitespace-nowrap font-display text-sm font-semibold uppercase tracking-widest">
          {[...CATEGORY_MARQUEE, ...CATEGORY_MARQUEE].map((c, i) => (
            <span key={i} className="flex items-center gap-10">
              {c}
              <span className="text-brand">●</span>
            </span>
          ))}
        </div>
      </div>

      {/* PROBLEM */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <SectionHead eyebrow="The problem" title={LANDING_COPY.problemTitle} />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {LANDING_COPY.problems.map((p, i) => (
            <article
              key={p.title}
              className="card group p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-pop"
            >
              <span className="font-display text-5xl font-extrabold text-brand/25 transition-colors group-hover:text-brand">
                0{i + 1}
              </span>
              <h3 className="mt-4 text-xl font-bold">{p.title}</h3>
              <p className="mt-2 text-muted">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS (dark) */}
      <section className="bg-navy py-20 text-white sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead light eyebrow="How it works" title={LANDING_COPY.stepsTitle} />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-white/15 md:grid-cols-3">
            {LANDING_COPY.steps.map((s, i) => (
              <li key={s.title} className="bg-navy p-8 transition-colors hover:bg-navy-2">
                <span className="font-display text-6xl font-extrabold text-sun">{i + 1}</span>
                <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-white/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* RESEARCH-BACKED */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <SectionHead eyebrow="Research-backed" title="We mapped the market before building">
            The research dashboard benchmarks lost-and-found tools and university processes on two scores: how digital
            they are, and how built for a campus they are. The gap is where this product lives.
          </SectionHead>
          <div className="grid grid-cols-2 gap-4">
            {stats ? (
              <>
                <Stat n={stats.total} label="solutions benchmarked" />
                <Stat n={stats.mexico} label="from Mexico" />
                <Stat n={stats.mexicoDigital} label="Mexican ones mostly digital" />
                <Stat n={stats.campusSpecific} label="built specifically for campuses" />
              </>
            ) : (
              <div className="card col-span-2 p-6 text-sm text-muted">
                Live research numbers appear here when the database is reachable. Open the dashboard to see every entry.
              </div>
            )}
            <a href="/research" className="btn-ghost col-span-2">
              Open the research dashboard →
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y border-line bg-paper-2 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead eyebrow="What you get" title={LANDING_COPY.featuresTitle}>
            What runs today is marked clearly. What is planned for a pilot is marked too.
          </SectionHead>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {LANDING_COPY.features.map((f) => {
              const live = f.status.startsWith("Live");
              return (
                <article key={f.title} className="card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-pop">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                      live ? "bg-ok/15 text-ok" : "bg-paper-2 text-muted"
                    }`}
                  >
                    {f.status}
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{f.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <SectionHead eyebrow="Pricing" title="A price you can take to procurement">
          A flat monthly price per campus, based on student count. Private universities pay {privatePct}% more, annual
          billing takes {annualPct}% off. Simulated prices for a prototype, not a quote.
        </SectionHead>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TIERS.map((t, i) => {
            const featured = i === 1;
            return (
              <article
                key={t.key}
                className={`rounded-3xl border-2 p-7 transition-all duration-200 hover:-translate-y-1 ${
                  featured ? "border-ink bg-ink text-white shadow-hard" : "border-line bg-surface hover:shadow-pop"
                }`}
              >
                <h3 className="text-lg font-bold">{t.name}</h3>
                <p className={`mt-1 text-sm ${featured ? "text-white/70" : "text-muted"}`}>
                  {t.maxStudents === Infinity ? "15,000+ students" : `Up to ${t.maxStudents.toLocaleString()} students`}
                </p>
                <p className="mt-6 font-display text-5xl font-extrabold">
                  ${t.monthlyPrice}
                  <span className={`text-base font-medium ${featured ? "text-white/60" : "text-muted"}`}>/mo per campus</span>
                </p>
                <p className={`mt-1 text-xs ${featured ? "text-white/60" : "text-muted-2"}`}>
                  Private: ${getPricePerCampus(t, "private")}/mo per campus
                </p>
                <p className={`mt-5 text-sm ${featured ? "text-white/80" : "text-ink-soft"}`}>{t.blurb}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {FEATURES.filter((f) => f.tiers.includes(t.key)).slice(0, 4).map((f) => (
                    <li key={f.key} className="flex gap-2">
                      <span className={featured ? "text-sun" : "text-ok"} aria-hidden="true">✓</span>
                      {f.label}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <a href="/pricing" className="btn-primary px-7 py-3.5 text-base">
            Price my campus in the simulator →
          </a>
        </div>
      </section>

      {/* STATUS */}
      <section className="mx-auto max-w-6xl px-6 pb-20 sm:pb-28">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="card p-7">
            <h3 className="text-lg font-bold">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-ok align-middle" />
              Running today
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              {PRODUCT_STATUS.live.map((l) => (
                <li key={l} className="flex gap-2"><span className="text-ok" aria-hidden="true">✓</span>{l}</li>
              ))}
            </ul>
          </div>
          <div className="card border-dashed p-7">
            <h3 className="text-lg font-bold">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-sun align-middle" />
              Planned for a pilot
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              {PRODUCT_STATUS.planned.map((l) => (
                <li key={l} className="flex gap-2"><span className="text-muted-2" aria-hidden="true">○</span>{l}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-line bg-paper-2 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHead eyebrow="FAQ" title={LANDING_COPY.faqTitle} />
          <div className="mt-10 space-y-3">
            {LANDING_COPY.faq.map((item) => (
              <details key={item.q} className="card group p-5 open:shadow-pop">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper-2 text-lg transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-brand text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 py-16 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold leading-tight sm:text-5xl">{LANDING_COPY.finalTitle}</h2>
            <p className="mt-3 text-lg text-white/85">{LANDING_COPY.finalBody}</p>
          </div>
          <a href="/pricing" className="btn bg-white px-8 py-4 text-base text-brand hover:-translate-y-0.5 hover:bg-paper">
            Open the simulator →
          </a>
        </div>
      </section>
    </>
  );
}

function Stat({ n, label }) {
  return (
    <div className="card p-5">
      <p className="font-display text-5xl font-extrabold text-brand">{n}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
