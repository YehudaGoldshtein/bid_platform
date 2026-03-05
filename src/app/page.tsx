import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold text-indigo-700 mb-2">Bid Platform</h1>
      <p className="text-gray-500 mb-12 text-lg">Choose your role to get started</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl">
        <Link
          href="/customer"
          className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-10 border border-gray-200 hover:border-indigo-400 group"
        >
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">Customer</span>
          <span className="text-sm text-gray-400 mt-1">Create and manage bids</span>
        </Link>

        <Link
          href="/vendor"
          className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-10 border border-gray-200 hover:border-indigo-400 group"
        >
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">Vendor</span>
          <span className="text-sm text-gray-400 mt-1">Browse bids and submit prices</span>
        </Link>
      </div>
    </main>
  );
}
