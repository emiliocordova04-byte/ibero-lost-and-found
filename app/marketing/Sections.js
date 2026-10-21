"use client";

import { BRAND, PERSONA, LANDING_COPY, AB_TESTS } from "@/lib/marketingContent.mjs";
import { CopyButton, SaveButton, Section, Badge, useToast, copyText } from "./ui";

export function BrandSection() {
  const toast = useToast();
  return (
    <Section
      id="brand"
      num="1"
      title="Brand system"
      intro={`${BRAND.mission} The same tokens drive the whole site: change one color in globals.css and every page follows.`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BRAND.colors.map((c) => (
          <button
            key={c.hex}
            type="button"
            onClick={async () => {
              await copyText(c.hex);
              toast(`Copied ${c.hex}`);
            }}
            className="card group overflow-hidden text-left transition-all hover:-translate-y-1 hover:shadow-pop"
            aria-label={`Copy ${c.name} ${c.hex}`}
          >
            <div className="h-24" style={{ background: c.hex }} />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold">{c.name}</p>
                <span className="font-mono text-xs text-muted-2 group-hover:text-brand">{c.hex}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{c.role}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {BRAND.typography.map((t) => (
          <div key={t.role} className="card p-6">
            <Badge>{t.role}</Badge>
            <p
              className="mt-4 text-3xl leading-tight"
              style={{
                fontFamily: t.role === "Display" ? "var(--font-display)" : "var(--font-sans)",
                fontWeight: t.role === "Display" ? 800 : 500,
              }}
            >
              {t.sample}
            </p>
            <p className="mt-3 font-semibold">{t.family}</p>
            <p className="text-sm text-muted">{t.usage}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="card p-6">
          <h3 className="text-lg font-bold">Voice principles</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {BRAND.voice.principles.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div className="card border-ok/40 p-6">
          <h3 className="text-lg font-bold text-ok">Do</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {BRAND.voice.do.map((p) => (
              <li key={p} className="flex gap-2"><span className="text-ok" aria-hidden="true">✓</span>{p}</li>
            ))}
          </ul>
        </div>
        <div className="card border-danger/40 p-6">
          <h3 className="text-lg font-bold text-danger">Avoid</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {BRAND.voice.avoid.map((p) => (
              <li key={p} className="flex gap-2"><span className="text-danger" aria-hidden="true">✕</span>{p}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-6 rounded-2xl bg-ink p-6 text-white">
        <div className="inline-flex items-center gap-3">
          <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
            <rect width="40" height="40" rx="11" fill="#D8281E" />
            <path d="M20 8c-5.2 0-9 3.9-9 8.8 0 6.2 7 12.6 8.1 13.6a1.4 1.4 0 0 0 1.8 0C22 29.4 29 23 29 16.8 29 11.9 25.2 8 20 8Z" fill="#fff" />
            <circle cx="20" cy="16.5" r="3.4" fill="#D8281E" />
            <rect x="19" y="18" width="2" height="5" rx="1" fill="#D8281E" />
          </svg>
          <span className="font-display text-2xl font-bold">
            Ibero <span className="text-sun">Lost &amp; Found</span>
          </span>
        </div>
        <ul className="flex-1 space-y-1 text-sm text-white/75">
          {BRAND.logoRules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export function PersonaSection() {
  const P = PERSONA;
  const asset = {
    asset_type: "copy",
    title: `Persona: ${P.name}`,
    channel: null,
    body: `${P.name}, ${P.role}, ${P.org}\n\n"${P.quote}"\n\nGoals:\n${P.goals.map((g) => `- ${g}`).join("\n")}\n\nFrustrations:\n${P.frustrations.map((g) => `- ${g}`).join("\n")}\n\nObjections:\n${P.objections.map((g) => `- ${g}`).join("\n")}\n\nChannels:\n${P.channels.map((g) => `- ${g}`).join("\n")}`,
  };
  return (
    <Section id="persona" num="2" title="Target persona" intro="Every post, script and headline is written for this one person, chosen as the decision maker who would approve a pilot.">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card overflow-hidden">
          <div className="bg-navy p-6 text-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sun font-display text-2xl font-extrabold text-ink">
              MR
            </div>
            <h3 className="mt-4 text-2xl font-extrabold">{P.name}</h3>
            <p className="text-white/80">{P.role}</p>
            <p className="text-sm text-white/60">{P.org}</p>
          </div>
          <div className="p-6">
            <blockquote className="font-display text-lg font-semibold leading-snug">&ldquo;{P.quote}&rdquo;</blockquote>
            <p className="mt-4 text-xs text-muted-2">{P.label}</p>
            <div className="mt-5 flex gap-2">
              <CopyButton text={asset.body} label="Copy persona" />
              <SaveButton asset={asset} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Goals", P.goals, "ok"],
            ["Frustrations", P.frustrations, "brand"],
            ["Objections to handle", P.objections, "sun"],
            ["Where to reach her", P.channels, "navy"],
          ].map(([title, items, tone]) => (
            <div key={title} className="card p-5">
              <Badge tone={tone}>{title}</Badge>
              <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                {items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function CopySection() {
  const L = LANDING_COPY;
  const hero = AB_TESTS[0].variants;
  const cta = AB_TESTS[1].variants;
  const blocks = [
    {
      title: "Hero",
      body: `Eyebrow: ${L.eyebrow}\nHeadline A: ${hero.A}\nHeadline B: ${hero.B}\nSubhead: ${L.subhead}\nPrimary button A: ${cta.A}\nPrimary button B: ${cta.B}\nSecondary button: ${L.secondaryCta}`,
    },
    { title: "Problem", body: `${L.problemTitle}\n\n${L.problems.map((p) => `${p.title}: ${p.body}`).join("\n")}` },
    { title: "How it works", body: `${L.stepsTitle}\n\n${L.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.body}`).join("\n")}` },
    { title: "Features", body: `${L.featuresTitle}\n\n${L.features.map((f) => `${f.title} (${f.status}): ${f.body}`).join("\n")}` },
    { title: "FAQ", body: L.faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n") },
    { title: "Closing call to action", body: `${L.finalTitle}\n${L.finalBody}` },
  ];
  return (
    <Section
      id="copy"
      num="3"
      title="Landing page copy"
      intro="This copy lives in one source file and renders the homepage you see at /. Nothing here claims customers or results that do not exist."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {blocks.map((b) => {
          const asset = { asset_type: "copy", title: `Landing copy: ${b.title}`, channel: null, body: b.body };
          return (
            <article key={b.title} className="card flex flex-col p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{b.title}</h3>
                <Badge>copy</Badge>
              </div>
              <pre className="mt-3 flex-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-soft">{b.body}</pre>
              <div className="mt-4 flex gap-2">
                <CopyButton text={b.body} />
                <SaveButton asset={asset} />
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
