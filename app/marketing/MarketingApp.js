"use client";

import { calendarToCsv, kitToJson, kitToMarkdown } from "@/lib/exporters.mjs";
import { ToastHost, AssetsProvider, downloadFile, copyText, useToast } from "./ui";
import { BrandSection, PersonaSection, CopySection } from "./Sections";
import { PostsSection, ScriptsSection, CalendarSection } from "./Content";
import { AbSection } from "./AbLab";
import { SavedSection } from "./Saved";

const NAV = [
  ["brand", "Brand"],
  ["persona", "Persona"],
  ["copy", "Landing copy"],
  ["posts", "Posts"],
  ["scripts", "Scripts"],
  ["calendar", "Calendar"],
  ["ab", "A/B tests"],
  ["saved", "Saved"],
];

function ExportBar() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="btn-primary btn-sm"
        onClick={() => downloadFile("ibero-marketing-kit.md", kitToMarkdown(), "text/markdown")}
      >
        Download kit (.md)
      </button>
      <button
        type="button"
        className="btn bg-white text-ink btn-sm hover:-translate-y-0.5"
        onClick={() => downloadFile("campaign-calendar.csv", calendarToCsv(), "text/csv")}
      >
        Calendar (.csv)
      </button>
      <button
        type="button"
        className="btn bg-white text-ink btn-sm hover:-translate-y-0.5"
        onClick={() => downloadFile("ibero-marketing-kit.json", kitToJson(), "application/json")}
      >
        Everything (.json)
      </button>
      <button
        type="button"
        className="btn border border-white/40 text-white btn-sm hover:bg-white/10"
        onClick={async () => {
          const ok = await copyText(kitToMarkdown());
          toast(ok ? "Whole kit copied as Markdown" : "Copy failed", ok ? "ok" : "error");
        }}
      >
        Copy all
      </button>
    </div>
  );
}

export default function MarketingApp() {
  return (
    <ToastHost>
      <AssetsProvider>
        <header className="bg-navy text-white">
          <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
            <p className="eyebrow !text-sun">Week 4 · Marketing engine</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              The marketing engine behind the homepage
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/75">
              Brand, persona, copy, 10 posts, 3 video scripts and a 14-day calendar, all written for one reader: the
              university administrator. Copy, export or save anything, and watch two live A/B tests run on the homepage.
            </p>
            <div className="mt-7">
              <ExportBar />
            </div>
          </div>
        </header>

        <div className="sticky top-[61px] z-40 border-b border-line bg-paper/90 backdrop-blur-md">
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 py-2.5" aria-label="Marketing sections">
            {NAV.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-ink hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mx-auto max-w-6xl px-6">
          <BrandSection />
          <PersonaSection />
          <CopySection />
          <PostsSection />
          <ScriptsSection />
          <CalendarSection />
          <AbSection />
          <SavedSection />
        </div>
      </AssetsProvider>
    </ToastHost>
  );
}
