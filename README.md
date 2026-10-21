# Ibero Lost & Found

A lost & found web app for Universidad Iberoamericana. Students will be able to report lost or found items, browse and search the list, and mark items as recovered.

**Live site:** https://ibero-lost-and-found.vercel.app

## Status

Working prototype built across a university course. Live today: a landing page with an interactive item demo (`/`), a rule-based item description extractor (`/core`), a market research dashboard (`/research`), the product and pricing model (`/product`, `/pricing`) and the Week 4 marketing engine with two live A/B tests (`/marketing`). The student report/browse app and the administrator dashboard are planned. See `/docs` for details and `docs/WEEK4_PLAN.md` for the Week 4 plan.

## Tech Stack

- **Frontend:** Next.js (App Router) + React + Tailwind CSS
- **Backend / Database:** Supabase (Postgres)
- **Hosting:** Vercel
- **Version control:** GitHub

## Getting Started

1. Clone the repo:git clone https://github.com/emiliocordova04-byte/ibero-lost-and-found.git
cd ibero-lost-and-found
2. Install dependencies:
npm install

3. Create a `.env.local` file in the root folder with your own Supabase credentials (see `.env.example` for the required variable names). Never commit this file.
4. Run the dev server:
npm run dev

5. Open [http://localhost:3000](http://localhost:3000).

## Tests

`npm test` runs 21 tests with Node's built-in runner (pricing logic, A/B assignment and statistics, content integrity, exporters, headline checker).

## Database setup

Run the SQL files in the Supabase SQL editor: `supabase_pricing_scenarios.sql` (Week 3) and `supabase_marketing.sql` (Week 4: `marketing_assets` and `ab_events`).

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Publishable (anon) key |

## Author

Built by Emilio Cordova · 2026