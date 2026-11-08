import { ROADMAP } from "@/lib/ventureData.mjs";
import { rankRoadmap } from "@/lib/venture.mjs";

export const metadata = {
  title: "Version 2 roadmap | Ibero Lost & Found",
  description: "What comes after the course project, ranked by impact divided by effort.",
};

export default function RoadmapPage() {
  const items = rankRoadmap(ROADMAP);
  const EFFORT = { 1: "Small", 2: "Medium", 3: "Large" };
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <p className="eyebrow">Week 6 · Version 2</p>
      <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Version 2 roadmap</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Each item solves a real gap found while building and testing. Score is impact (1 to 5) divided by effort (1 to 3), so the
        cheap, important things come first. Impact and effort are my own estimates, not measurements.
      </p>
      <ol className="mt-8 space-y-3">
        {items.map((i, n) => (
          <li key={i.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <div className="font-display text-3xl font-extrabold text-brand sm:w-14">{n + 1}</div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold">{i.title}</h2>
              <p className="text-sm text-muted">Problem: {i.problem}.</p>
            </div>
            <dl className="grid grid-cols-3 gap-4 text-center text-sm sm:w-72">
              <div><dt className="text-xs uppercase tracking-wider text-muted-2">Impact</dt><dd className="font-semibold">{i.impact} of 5</dd></div>
              <div><dt className="text-xs uppercase tracking-wider text-muted-2">Effort</dt><dd className="font-semibold">{EFFORT[i.effort]}</dd></div>
              <div><dt className="text-xs uppercase tracking-wider text-muted-2">Score</dt><dd className="font-semibold">{i.score}</dd></div>
            </dl>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-sm text-muted-2">See the <a className="text-brand hover:underline" href="/impact">harm check</a> for the open risks these items close.</p>
    </div>
  );
}
