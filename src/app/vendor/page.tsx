"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Bid {
  id: string;
  title: string;
  description: string;
  deadline: string;
}

export default function VendorDashboard() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bids")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch bids");
        return res.json();
      })
      .then((data) => setBids(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-indigo-500 hover:text-indigo-700 mb-1 inline-block">&larr; Back to Home</Link>
          <h1 className="text-3xl font-bold text-gray-800">Vendor Dashboard</h1>
          <p className="text-gray-500 mt-1">Browse available bids and submit your prices</p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error: {error}
          </div>
        )}

        {!loading && !error && bids.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No bids available at the moment.</p>
          </div>
        )}

        {!loading && !error && bids.length > 0 && (
          <div className="grid gap-4">
            {bids.map((bid) => (
              <Link
                key={bid.id}
                href={`/vendor/${bid.id}`}
                className="block bg-white rounded-xl shadow hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-indigo-300"
              >
                <h2 className="text-lg font-semibold text-gray-800">{bid.title}</h2>
                <p className="text-gray-500 text-sm mt-1 line-clamp-3">{bid.description}</p>
                <div className="mt-3 text-xs text-gray-400">
                  Deadline: {new Date(bid.deadline).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
