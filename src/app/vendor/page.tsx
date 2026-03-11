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
    <main className="min-h-screen py-10 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm mb-1 inline-block transition-colors" style={{ color: 'var(--gold)' }}>&larr; Back to Home</Link>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--ink)' }}>Vendor Portal</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Browse available bids and submit your prices</p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--gold-b)', borderTopColor: 'var(--gold)' }}></div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 text-sm" style={{ background: 'var(--red-bg)', border: '1px solid var(--red-b)', borderRadius: '8px', color: 'var(--red)' }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && bids.length === 0 && (
          <div className="text-center py-20" style={{ color: 'var(--muted)' }}>
            <div className="text-3xl mb-3 opacity-50">📋</div>
            <p className="font-semibold" style={{ color: 'var(--ink2)' }}>No bids available at the moment.</p>
            <p className="text-sm mt-1">Check back later for new bid requests.</p>
          </div>
        )}

        {!loading && !error && bids.length > 0 && (
          <div className="grid gap-4">
            {bids.map((bid) => (
              <Link
                key={bid.id}
                href={`/vendor/${bid.id}`}
                className="block p-5 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '12px' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--gold-b)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.07)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <h2 className="font-bold" style={{ fontSize: '0.95rem', color: 'var(--ink)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>{bid.title}</h2>
                <p className="text-sm mt-1 line-clamp-3" style={{ color: 'var(--muted)' }}>{bid.description}</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs font-bold px-2 py-0.5" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-b)', borderRadius: '100px' }}>
                    Deadline: {new Date(bid.deadline).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
