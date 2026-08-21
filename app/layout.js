import "./globals.css";

export const metadata = {
  title: "Ibero Lost & Found",
  description: "Find or report lost items on campus.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-gray-900">
        <nav className="border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="font-semibold text-lg">Ibero Lost & Found</a>
            <div className="flex gap-6 text-sm">
              <a href="/" className="hover:text-blue-600">Home</a>
              <a href="/docs" className="hover:text-blue-600">Docs</a>
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 py-6">
          <div className="max-w-5xl mx-auto px-6 text-sm text-gray-500 flex flex-col sm:flex-row justify-between gap-1">
            <span>Ibero Lost & Found — Universidad Iberoamericana</span>
            <span>Built by Emilio Cordova · 2026.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}