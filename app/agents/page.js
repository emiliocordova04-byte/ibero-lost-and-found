import { AGENTS } from "@/lib/ventureData.mjs";

export const metadata = {
  title: "Agent map | Ibero Lost & Found",
  description: "Which agent does each job, what it reads and writes, its guardrail and where a human decides.",
};

const KIND = {
  "rule-based": { label: "Rule-based", cls: "bg-paper-2 text-ink" },
  simulated: { label: "Simulated", cls: "bg-brand-soft text-brand-dark" },
  template: { label: "Templates", cls: "bg-paper-2 text-ink" },
  human: { label: "Human", cls: "bg-navy text-white" },
  "ai-assisted": { label: "AI-assisted", cls: "bg-sun text-ink" },
};

function Node({ a }) {
  const k = KIND[a.kind];
  const human = a.kind === "human";
  return (
    <a href={a.route} className={`block min-w-0 flex-1 rounded-2xl p-4 text-center transition-transform hover:-translate-y-0.5 ${human ? "border-4 border-double border-ink bg-paper-2" : "card"}`}>
      <div className="font-display text-base font-bold">{a.name}</div>
      <div className="mt-1 font-mono text-xs text-muted-2">{a.route}</div>
      <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${k.cls}`}>{k.label}</span>
    </a>
  );
}

const Arrow = () => <div className="flex shrink-0 items-center justify-center text-2xl font-bold text-muted-2" aria-hidden="true">&rarr;</div>;
const Plain = ({ children }) => (
  <div className="flex min-w-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-line-strong p-4 text-center text-sm text-muted">{children}</div>
);
const by = (id) => AGENTS.find((a) => a.id === id);

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <p className="eyebrow">Week 6 · Agent map</p>
      <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Who does what, and where a person decides</h1>
      <p className="mt-3 max-w-2xl text-muted">
        The venture is a small team of agents. None of them is a paid AI model: they are rules, templates and simulators, and each one
        says so on its own page. The boxes with a double border are people, not software.
      </p>

      <div className="mt-8 space-y-4" aria-label="Agent flow">
        <div className="flex flex-col gap-3 lg:flex-row">
          <Plain>Student</Plain><Arrow /><Node a={by("intake")} /><Arrow /><Node a={by("extractor")} /><Arrow /><Plain>Database<br />chat_sessions</Plain><Arrow /><Node a={by("staff")} />
        </div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <Plain>Visitor</Plain><Arrow /><Node a={by("marketing")} /><Arrow /><Plain>marketing_assets<br />ab_events</Plain><Arrow /><Node a={by("pricing")} /><Arrow /><Plain>University buyer<br />(human decision)</Plain>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <Plain>Emilio (human)</Plain><Arrow /><Node a={by("coding")} /><Arrow /><Plain>GitHub<br />Vercel</Plain><Arrow /><Plain>Every page above</Plain>
        </div>
      </div>

      <div className="card mt-10 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-paper-2 text-xs uppercase tracking-wider text-muted-2">
            <tr>
              {["Agent", "Kind", "Reads", "Writes", "Stored in", "Guardrail", "Human checkpoint"].map((h) => (
                <th key={h} className="px-3 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((a) => (
              <tr key={a.id} className="border-t border-line align-top">
                <td className="px-3 py-3 font-semibold"><a className="text-brand hover:underline" href={a.route}>{a.name}</a></td>
                <td className="px-3 py-3">{KIND[a.kind].label}</td>
                <td className="px-3 py-3">{a.input}</td>
                <td className="px-3 py-3">{a.output}</td>
                <td className="px-3 py-3 font-mono text-xs">{a.store}</td>
                <td className="px-3 py-3">{a.guardrail}</td>
                <td className="px-3 py-3">{a.human}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted-2">Next: see the <a className="text-brand hover:underline" href="/impact">impact and harm check</a> or go back to the <a className="text-brand hover:underline" href="/demo">guided demo</a>.</p>
    </div>
  );
}
