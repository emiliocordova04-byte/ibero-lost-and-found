export default function Docs() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold sm:text-5xl mb-4">Docs</h1>
      <p className="text-muted mb-6">
        This page will hold setup notes and product documentation as the project grows.
      </p>
      <h2 className="text-xl font-semibold mb-2">Roadmap</h2>
      <ul className="list-disc list-inside text-muted space-y-1">
        <li>Report lost/found items with photos</li>
        <li>Browse and search items</li>
        <li>Filter by category and status</li>
        <li>Item detail pages</li>
        <li>Mark items as recovered</li>
      </ul>
      <h2 className="text-2xl font-bold mt-10 mb-3">Tech Stack</h2>
      <p className="text-ink-soft">Next.js, React, Tailwind CSS, Supabase, GitHub, Vercel.</p>

      <h2 className="text-2xl font-bold mt-10 mb-3">
        Generative Core Agent — Item Description Extractor
      </h2>
      <p className="text-muted mb-3">
        The <code>/core</code> page lets a user describe a lost or found item in
        free text (English or Spanish) and pulls out structured fields: item,
        category, color, location and date. Detected results can be saved and the
        five most recent extractions are listed below the form.
      </p>
      <p className="text-muted mb-3">
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
      <p className="text-muted mb-2">
        Saved extractions are stored in the <code>core_outputs</code> table:
      </p>
      <ul className="list-disc list-inside text-muted space-y-1">
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
      <p className="text-muted mb-3">
        The <code>/research</code> page maps who else solves (or fails to
        solve) lost-and-found: global software, Mexican university processes,
        and informal substitutes like WhatsApp groups. Entries are added by
        hand through an intake form — nothing here is AI-generated or scraped
        automatically, since that would need a paid API.
      </p>
      <p className="text-muted mb-3">
        Each entry gets two 0–10 scores: <strong>digital_score</strong> (0 =
        fully manual/paper process, 10 = fully digital) and{" "}
        <strong>campus_score</strong> (0 = generic consumer tool, 10 = built
        specifically for a campus). The risk map plots every entry on those
        two axes so the gap — digital AND campus-specific, which is what
        Ibero Lost &amp; Found is aiming for — is visible at a glance.
      </p>
      <p className="text-muted mb-2">
        Entries are stored in the <code>research_entries</code> table:
      </p>
      <ul className="list-disc list-inside text-muted space-y-1">
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
      <p className="text-muted mt-3">
        The homepage&apos;s &quot;Research snapshot&quot; widget reads the same
        table to show a live count and a Mexico-specific stat, so the
        research isn&apos;t just sitting on its own page.
      </p>

      <h2 className="text-2xl font-bold mt-10 mb-3">
        Product Architecture + Pricing Simulator
      </h2>
      <p className="text-muted mb-3">
        The <code>/product</code> page turns the Week 2 research into a sellable
        shape: 6 customer segments (small/medium/large, crossed with
        private/public universities — size is auto-detected from students per
        campus, only ownership is picked by hand), 3 pricing tiers
        (Starter/Campus/Enterprise, cut by number of students per campus, not
        by feature gating alone), and a feature map showing what unlocks at
        each tier.
      </p>
      <p className="text-muted mb-3">
        The <code>/pricing</code> page is the simulator: a revenue calculator
        (students per campus &times; number of campuses), an ownership toggle
        that adds a 15% per-campus premium for private universities, a
        monthly/annual billing toggle (25% annual discount), and named
        scenarios that save to Supabase and can be revisited or deleted. All
        prices are simulated &mdash; there is no real checkout or billing.
      </p>
      <p className="text-muted mb-2">
        The pricing logic itself (<code>lib/pricing.mjs</code>) is plain,
        tested JavaScript with no dependency on the page: tier assignment,
        segment auto-detection, and revenue math are covered by{" "}
        <code>lib/pricing.test.mjs</code>, run with{" "}
        <code>node --test lib/pricing.test.mjs</code>.
      </p>
      <p className="text-muted mb-2">
        Saved scenarios are stored in the <code>pricing_scenarios</code> table:
      </p>
      <ul className="list-disc list-inside text-muted space-y-1">
        <li><code>id</code> &mdash; uuid, primary key</li>
        <li><code>created_at</code> &mdash; timestamptz, default <code>now()</code></li>
        <li><code>scenario_name</code> &mdash; text (the university name)</li>
        <li><code>segment</code> &mdash; text (small_private / small_public / medium_private / medium_public / large_private / large_public)</li>
        <li><code>tier</code> &mdash; text (starter / campus / enterprise)</li>
        <li><code>students_per_campus</code> &mdash; integer</li>
        <li><code>campuses</code> &mdash; integer, default 1</li>
        <li><code>billing_cycle</code> &mdash; text (monthly / annual)</li>
        <li><code>monthly_revenue</code> &mdash; numeric</li>
        <li><code>annual_revenue</code> &mdash; numeric</li>
      </ul>
      <p className="text-muted mt-3">
        Scope cut this week: no admin dashboard for managing subscriptions
        &mdash; this is a pricing simulator, not a billing system.
      </p>
      <h2 className="text-2xl font-bold mt-10 mb-3">
        Marketing Engine + Content System
      </h2>
      <p className="text-muted mb-3">
        The homepage is now a landing page for the person who would buy this: a
        university administrator. The <code>/marketing</code> page is the
        engine behind it: a brand system, one target persona, the landing page
        copy, 10 social posts, 3 video scripts and a 14-day campaign calendar.
        All content is hand-written in <code>lib/marketingContent.mjs</code> and
        is the single source for both pages, so the copy visitors see and the
        copy documented in the engine cannot drift apart. Nothing is generated
        by AI at runtime and no customer claims are made.
      </p>
      <p className="text-muted mb-3">
        Two A/B tests run live on the homepage: the hero headline and the label
        of the primary button. Each visitor gets an anonymous id in
        localStorage; their variant for each test is a hash of that id and the
        test key (<code>lib/ab.mjs</code>), so it is stable and the two tests
        are independent. One impression and one click are recorded per visitor
        per test. <code>/marketing</code> reads the counts and runs a
        two-proportion z-test (<code>lib/abstats.mjs</code>), and says &quot;not
        enough data&quot; until each variant has at least 30 visitors. Add{" "}
        <code>?ab_hero_headline=B</code> or <code>?ab_cta_label=B</code> to
        preview a variant without being counted.
      </p>
      <p className="text-muted mb-2">
        Two tables back it (<code>supabase_marketing.sql</code>):
      </p>
      <ul className="list-disc list-inside text-muted space-y-1">
        <li><code>marketing_assets</code> &mdash; id, created_at, asset_type (post / script / headline / copy), title, channel, day_number, body</li>
        <li><code>ab_events</code> &mdash; id, created_at, test_key, variant (A / B), event (impression / click), visitor_id; unique on (test_key, visitor_id, event)</li>
      </ul>
      <p className="text-muted mt-3">
        Tests: <code>npm test</code> runs 21 tests (10 from Week 3, 11 new
        covering A/B assignment, the z-test, content integrity, exporters and
        the headline checker). Scope cut this week: no real AI generation, no
        auto-posting to social networks, no login, no paid analytics.
      </p>

    </div>
  );
}
