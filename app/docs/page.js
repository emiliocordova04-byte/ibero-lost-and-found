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
    </div>
  );
}