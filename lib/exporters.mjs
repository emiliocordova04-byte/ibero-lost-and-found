// Copy and export helpers for the marketing kit. Pure functions that return
// strings, so the buttons in the UI stay thin and the formats are testable.

import {
  BRAND,
  PERSONA,
  LANDING_COPY,
  POSTS,
  SCRIPTS,
  CALENDAR,
  getAsset,
  scriptToText,
} from "./marketingContent.mjs";

// RFC 4180 CSV cell: wrap in quotes when needed and double inner quotes.
export function csvCell(value) {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(columns, rows) {
  const head = columns.map(csvCell).join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(r[c])).join(","));
  return [head, ...body].join("\r\n");
}

export function calendarRows() {
  return CALENDAR.map((d) => {
    const asset = getAsset(d.assetId);
    return {
      day: d.day,
      phase: d.phase,
      channel: d.channel,
      asset_id: d.assetId,
      asset_title: asset ? asset.title || asset.hook : "",
      call_to_action: d.cta,
    };
  });
}

export function calendarToCsv() {
  return toCsv(
    ["day", "phase", "channel", "asset_id", "asset_title", "call_to_action"],
    calendarRows()
  );
}

export function postToText(post) {
  return `${post.channel} post (${post.angle})\n\n${post.body}`;
}

export function kitToMarkdown() {
  const out = [];
  out.push(`# ${BRAND.name} marketing kit`, "", `_${BRAND.tagline}_`, "");
  out.push("## Target persona", "", `**${PERSONA.name}**, ${PERSONA.role}, ${PERSONA.org}`, "");
  out.push(`> ${PERSONA.quote}`, "");
  out.push("## Landing page copy", "", LANDING_COPY.subhead, "");
  out.push("## Social posts", "");
  for (const p of POSTS) {
    out.push(`### ${p.id}: ${p.hook}`, `Channel: ${p.channel}`, "", p.body, "");
  }
  out.push("## Video scripts", "");
  for (const s of SCRIPTS) {
    out.push(`### ${s.id}: ${s.title}`, "", "```", scriptToText(s), "```", "");
  }
  out.push("## 14-day campaign calendar", "", "| Day | Phase | Channel | Asset | CTA |", "|---|---|---|---|---|");
  for (const r of calendarRows()) {
    out.push(`| ${r.day} | ${r.phase} | ${r.channel} | ${r.asset_id} | ${r.call_to_action} |`);
  }
  return out.join("\n");
}

export function kitToJson() {
  return JSON.stringify(
    { brand: BRAND, persona: PERSONA, landing: LANDING_COPY, posts: POSTS, scripts: SCRIPTS, calendar: CALENDAR },
    null,
    2
  );
}
