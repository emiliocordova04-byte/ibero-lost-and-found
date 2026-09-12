export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">Ibero Lost & Found</h1>
      <p className="text-lg text-gray-600 mb-8">
        Find or report lost items on campus — fast, simple, and free.
      </p>
      <button
        disabled
        className="bg-blue-600 text-white px-6 py-3 rounded-lg opacity-60 cursor-not-allowed mb-6"
      >
        Report an Item
      </button>

      <div className="grid sm:grid-cols-3 gap-6 mt-16 text-left">
        <div className="border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold mb-1">Report items</h3>
          <p className="text-sm text-gray-500">Coming soon — post lost or found items in seconds.</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold mb-1">Search & filter</h3>
          <p className="text-sm text-gray-500">Coming soon — find items by category or status.</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold mb-1">Mark as recovered</h3>
          <p className="text-sm text-gray-500">Coming soon — close the loop when an item is returned.</p>
        </div>
      </div>
    </div>
  );
}