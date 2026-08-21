# Ibero Lost & Found

A lost & found web app for Universidad Iberoamericana. Students will be able to report lost or found items, browse and search the list, and mark items as recovered.

**Live site:** https://ibero-lost-and-found.vercel.app

## Status

This is a Week 0 infrastructure build. Core features (report, browse, search, mark recovered) are scoped for upcoming weeks — see `/docs` for the roadmap.

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

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Publishable (anon) key |

## Author

Built by Emilio Cordova · 2026