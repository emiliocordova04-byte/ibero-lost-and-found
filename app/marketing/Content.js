"use client";

import { useMemo, useState } from "react";
import {
  POSTS,
  SCRIPTS,
  CALENDAR,
  CAMPAIGN_PHASES,
  CHANNEL_LIMITS,
  getAsset,
  scriptToText,
  scriptDuration,
} from "@/lib/marketingContent.mjs";
import { postToText } from "@/lib/exporters.mjs";
import { CopyButton, SaveButton, Section, Badge } from "./ui";

const CHANNELS = ["All", "LinkedIn", "X", "Instagram"];

export function PostsSection() {
  const [channel, setChannel] = useState("All");
  const list = useMemo(() => POSTS.filter((p) => channel === "All" || p.channel === channel), [channel]);
  return (
    <Section id="posts" num="4" title="10 social posts" intro="Written for LinkedIn first, since that is where the persona is reached. Character counters use each channel's limit.">
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter posts by channel">
        {CHANNELS.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={channel === c}
            onClick={() => setChannel(c)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              channel === c ? "border-ink bg-ink text-white" : "border-line-strong bg-surface hover:border-ink"
            }`}
          >
            {c}
            {c !== "All" && <span className="ml-1.5 opacity-60">{POSTS.filter((p) => p.channel === c).length}</span>}
          </button>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {list.map((p) => {
          const limit = CHANNEL_LIMITS[p.channel];
          const used = p.body.length;
          const over = used > limit;
          const asset = { asset_type: "post", title: `${p.id}: ${p.hook}`, channel: p.channel, body: p.body };
          return (
            <article id={p.id} key={p.id} className="card flex scroll-mt-36 flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Badge tone="navy">{p.channel}</Badge>
                  <Badge>{p.angle}</Badge>
                </div>
                <span className="font-mono text-xs text-muted-2">{p.id}</span>
              </div>
              <h3 className="mt-3 text-lg font-bold leading-snug">{p.hook}</h3>
              <pre className="mt-3 flex-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-soft">{p.body}</pre>
              <div className="mt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-paper-2" aria-hidden="true">
                  <div
                    className={`h-full rounded-full ${over ? "bg-danger" : "bg-ok"}`}
                    style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
                  />
                </div>
                <p className={`mt-1 text-xs ${over ? "text-danger" : "text-muted-2"}`}>
                  {used} / {limit} characters
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <CopyButton text={postToText(p)} label="Copy post" />
                <SaveButton asset={asset} />
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

export function ScriptsSection() {
  return (
    <Section id="scripts" num="5" title="3 video scripts" intro="Short vertical-friendly scripts. Each beat pairs what the viewer sees with the line spoken over it.">
      <div className="grid gap-5 lg:grid-cols-3">
        {SCRIPTS.map((s) => {
          const text = scriptToText(s);
          const asset = { asset_type: "script", title: `${s.id}: ${s.title}`, channel: null, body: text };
          return (
            <article id={s.id} key={s.id} className="card flex scroll-mt-36 flex-col p-5">
              <div className="flex items-center justify-between">
                <Badge tone="brand">{s.goal}</Badge>
                <span className="font-mono text-xs text-muted-2">{scriptDuration(s)}s</span>
              </div>
              <h3 className="mt-3 text-xl font-bold">{s.title}</h3>
              <p className="text-xs text-muted-2">{s.platform}</p>
              <ol className="mt-4 flex-1 space-y-3">
                {s.beats.map((b) => (
                  <li key={b.t} className="rounded-xl border border-line bg-paper/60 p-3">
                    <p className="font-mono text-[11px] font-bold text-brand">{b.t}</p>
                    <p className="mt-1 text-xs text-muted-2">Visual: {b.visual}</p>
                    <p className="mt-1 text-sm font-medium text-ink">&ldquo;{b.line}&rdquo;</p>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex gap-2">
                <CopyButton text={text} label="Copy script" />
                <SaveButton asset={asset} />
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

const PHASE_TONE = {
  awareness: "border-t-brand",
  education: "border-t-navy",
  proof: "border-t-sun",
  conversion: "border-t-ok",
};

export function CalendarSection() {
  return (
    <Section id="calendar" num="6" title="14-day campaign calendar" intro="Four phases that move the persona from recognizing the problem to opening the pricing simulator. Every day points at a real asset above.">
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CAMPAIGN_PHASES.map((ph) => (
          <div key={ph.key} className={`card border-t-4 p-4 ${PHASE_TONE[ph.key]}`}>
            <p className="font-bold">{ph.label}</p>
            <p className="text-xs text-muted-2">{ph.days}</p>
            <p className="mt-2 text-sm text-muted">{ph.goal}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CALENDAR.map((d) => {
          const a = getAsset(d.assetId);
          const title = a ? a.title || a.hook : d.assetId;
          const text = a ? (a.beats ? scriptToText(a) : postToText(a)) : "";
          const asset = {
            asset_type: a?.beats ? "script" : "post",
            title: `Day ${d.day}: ${title}`,
            channel: d.channel,
            day_number: d.day,
            body: `Day ${d.day} (${d.phase}) on ${d.channel}\nCall to action: ${d.cta}\n\n${text}`,
          };
          return (
            <article key={d.day} className={`card flex flex-col border-t-4 p-4 ${PHASE_TONE[d.phase]}`}>
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl font-extrabold">{d.day}</span>
                <Badge tone="navy">{d.channel}</Badge>
              </div>
              <a href={`#${d.assetId}`} className="mt-2 text-sm font-semibold leading-snug hover:text-brand">
                {title}
              </a>
              <p className="mt-2 flex-1 text-xs text-muted">CTA: {d.cta}{d.note && <span className="mt-1 block text-muted-2">{d.note}</span>}</p>
              <div className="mt-3 flex gap-2">
                <CopyButton text={asset.body} label="Copy" />
                <SaveButton asset={asset} />
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
