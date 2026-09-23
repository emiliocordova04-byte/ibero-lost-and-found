export default function Docs() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-4">Docs</h1>
      <p className="text-gray-600 mb-6">
        This page will hold setup notes and product documentation as the project grows.
      </p>
      <h2 className="text-xl font-semibold mb-2">Roadmap</h2>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        <li>Report lost/found items with photos</li>
        <li>Browse and search items</li>
        <li>Filter by category and status</li>
        <li>Item detail pages</li>
        <li>Mark items as recovered</li>
      </ul>
      <h2 className="text-2xl font-bold mt-10 mb-3">Tech Stack</h2>
      <p className="text-gray-300">Next.js, React, Tailwind CSS, Supabase, GitHub, Vercel.</p>

      <h2 className="text-2xl font-bold mt-10 mb-3">
        Generative Core Agent — Item Description Extractor
      </h2>
      <p className="text-gray-600 mb-3">
        The <code>/core</code> page lets a user describe a lost or found item in
        free text (English or Spanish) and pulls out structured fields: item,
        category, color, location and date. Detected results can be saved and the
        five most recent extractions are listed below the form.
      </p>
      <p className="text-gray-600 mb-3">
        <strong>The extraction is simulated.</strong> It does not call any paid AI
        API or run a real NLP model. It is a rule-based / keyword-matching
        function in plain JavaScript (<code>lib/extractItem.js</code>) using small
        lists of common colors, categories and campus locations plus simple date
        heuristics (<code>today/hoy</code>, <code>yesterday/ayer</code>, or a date
        pattern). Any field that cannot be confidently detected is reported as
        &quot;Not detected&quot; rather than guessed. Every result in the UI is
        labeled with a <em>&quot;SIMULATED AI EXTRACTION&quot;</em> badge so it is
        honest that no real AI model is involved.
      </p>
      <p className="text-gray-600 mb-2">
        Saved extractions are stored in the <code>core_outputs</code> table:
      </p>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        <li><code>id</code> — int8, primary key, auto-increment</li>
        <li><code>created_at</code> — timestamptz, default <code>now()</code></li>
        <li><code>raw_description</code> — text (the original user input)</li>
        <li><code>item</code> — text</li>
        <li><code>category</code> — text</li>
        <li><code>color</code> — text</li>
        <li><code>location</code> — text</li>
        <li><code>item_date</code> — text (detected date as free text)</li>
      </ul>

      <h2 className="text-2xl font-bold mt-10 mb-3">
        Research + Benchmarking Dashboard
      </h2>
      <p className="text-gray-600 mb-3">
        The <code>/research</code> page maps who else solves (or fails to
        solve) lost-and-found: global software, Mexican university processes,
        and informal substitutes like WhatsApp groups. Entries are added by
        hand through an intake form — nothing here is AI-generated or scraped
        automatically, since that would need a paid API.
      </p>
      <p className="text-gray-600 mb-3">
        Each entry gets two 0–10 scores: <strong>digital_score</strong> (0 =
        fully manual/paper process, 10 = fully digital) and{" "}
        <strong>campus_score</strong> (0 = generic consumer tool, 10 = built
        specifically for a campus). The risk map plots every entry on those
        two axes so the gap — digital AND campus-specific, which is what
        Ibero Lost &amp; Found is aiming for — is visible at a glance.
      </p>
      <p className="text-gray-600 mb-2">
        Entries are stored in the <code>research_entries</code> table:
      </p>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        <li><code>id</code> — int8, primary key, auto-increment</li>
        <li><code>created_at</code> — timestamptz, default <code>now()</code></li>
        <li><code>name</code> — text</li>
        <li><code>region</code> — text (Global / Mexico / Generic)</li>
        <li><code>type</code> — text (SaaS / Manual/Physical / Consumer App / Social/Informal)</li>
        <li><code>digital_score</code> — int, 0–10</li>
        <li><code>campus_score</code> — int, 0–10</li>
        <li><code>notes</code> — text</li>
        <li><code>source_url</code> — text</li>
      </ul>
      <p className="text-gray-600 mt-3">
        The homepage&apos;s &quot;Research snapshot&quot; widget reads the same
        table to show a live count and a Mexico-specific stat, so the
        research isn&apos;t just sitting on its own page.
      </p>
    </div>
  );
}