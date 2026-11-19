export const metadata = { title: "Page not found | Ibero Lost & Found" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-4xl font-extrabold">We could not find that page</h1>
      <p className="mt-3 text-muted">The link may be old or mistyped. These pages exist:</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href="/demo" className="btn-primary">Guided demo</a>
        <a href="/chat" className="btn-ghost">Report an item</a>
        <a href="/" className="btn-ghost">Home</a>
      </div>
    </div>
  );
}
