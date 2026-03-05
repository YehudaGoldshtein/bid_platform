"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Bid {
  id: string;
  title: string;
  description: string;
  deadline: string;
  vendor_response_count: number;
}

export default function CustomerDashboard() {
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-sm text-indigo-500 hover:text-indigo-700 mb-1 inline-block">&larr; Back to Home</Link>
            <h1 className="text-3xl font-bold text-gray-800">Customer Dashboard</h1>
          </div>
          <Link
            href="/customer/create"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow"
          >
            + New Bid
          </Link>
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
            <p className="text-lg">No bids yet.</p>
            <p className="text-sm mt-1">Create your first bid to get started.</p>
          </div>
        )}

        {!loading && !error && bids.length > 0 && (
          <div className="grid gap-4">
            {bids.map((bid) => (
              <Link
                key={bid.id}
                href={`/customer/${bid.id}`}
                className="block bg-white rounded-xl shadow hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-indigo-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{bid.title}</h2>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{bid.description}</p>
                  </div>
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ml-4">
                    {bid.vendor_response_count ?? 0} response{(bid.vendor_response_count ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>
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
