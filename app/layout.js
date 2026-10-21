import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/dm-sans";
import "./globals.css";
import Nav from "./components/Nav";
import Logo from "./components/Logo";

export const metadata = {
  title: "Ibero Lost & Found | Lost and found for university campuses",
  description:
    "A campus lost-and-found system for university administrators: one searchable record for every lost item, with pricing built for your campus size.",
};

const FOOTER_COLS = [
  {
    title: "Product",
    links: [
      { href: "/product", label: "Product" },
      { href: "/pricing", label: "Pricing simulator" },
      { href: "/core", label: "Live item demo" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/marketing", label: "Marketing engine" },
      { href: "/research", label: "Market research" },
      { href: "/docs", label: "Docs" },
    ],
  },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-paper text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-line bg-paper-2">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-[1.6fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-4 max-w-sm text-sm text-muted">
                Lost and found for university campuses. Working prototype built
                as a course project at Universidad Iberoamericana.
              </p>
            </div>
            {FOOTER_COLS.map((c) => (
              <div key={c.title}>
                <h3 className="font-display text-sm font-bold">{c.title}</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className="text-muted hover:text-brand">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-line">
            <div className="mx-auto flex max-w-6xl flex-col justify-between gap-1 px-6 py-5 text-xs text-muted-2 sm:flex-row">
              <span>Built by Emilio Cordova, 2026.</span>
              <span>Prices and AI-style outputs on this site are simulated unless labelled otherwise.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
