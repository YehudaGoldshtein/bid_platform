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
    <main className="min-h-screen py-10 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-sm mb-1 inline-block transition-colors" style={{ color: 'var(--gold)' }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--gold-l)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--gold)'}
            >&larr; Back to Home</Link>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--ink)' }}>Contractor Dashboard</h1>
          </div>
          <Link
            href="/customer/create"
            className="text-white px-5 py-2.5 font-semibold transition-all text-sm"
            style={{ background: 'var(--gold)', borderRadius: '7px' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--gold-l)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(232,146,10,0.3)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            + New Bid
          </Link>
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
            <p className="text-lg font-semibold" style={{ color: 'var(--ink2)' }}>No bids yet.</p>
            <p className="text-sm mt-1">Create your first bid to get started.</p>
          </div>
        )}

        {!loading && !error && bids.length > 0 && (
          <div className="grid gap-4">
            {bids.map((bid) => (
              <Link
                key={bid.id}
                href={`/customer/${bid.id}`}
                className="block p-5 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '12px' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--gold-b)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.07)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold" style={{ fontSize: '0.95rem', color: 'var(--ink)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>{bid.title}</h2>
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>{bid.description}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 whitespace-nowrap ml-4" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-b)', borderRadius: '100px' }}>
                    {bid.vendor_response_count ?? 0} response{(bid.vendor_response_count ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="mt-3 text-xs" style={{ color: 'var(--faint)' }}>
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
