"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Parameter {
  name: string;
  options: string[];
}

interface VendorResponse {
  vendor_name: string;
  submitted_at: string;
  prices: { combination_key: string; price: number }[];
}

interface Bid {
  id: string;
  title: string;
  description: string;
  deadline: string;
  parameters: Parameter[];
  vendor_responses: VendorResponse[];
}

interface MatchedPrice {
  vendor_name: string;
  price: number;
  submitted_at: string;
}

export default function CustomerBidDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/bids/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch bid");
        return res.json();
      })
      .then((data) => {
        setBid(data);
        const init: Record<string, string> = {};
        (data.parameters || []).forEach((p: Parameter) => {
          init[p.name] = "";
        });
        setSelections(init);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const allSelected =
    bid?.parameters &&
    bid.parameters.length > 0 &&
    bid.parameters.every((p) => selections[p.name]);

  const combinationKey = allSelected
    ? JSON.stringify(
        Object.keys(selections)
          .sort()
          .reduce((acc: Record<string, string>, key) => {
            acc[key] = selections[key];
            return acc;
          }, {})
      )
    : null;

  // Flatten vendor_responses to find matching prices
  const matchingPrices: MatchedPrice[] = [];
  if (combinationKey && bid?.vendor_responses) {
    for (const vr of bid.vendor_responses) {
      const match = vr.prices.find((p) => p.combination_key === combinationKey);
      if (match) {
        matchingPrices.push({
          vendor_name: vr.vendor_name,
          price: match.price,
          submitted_at: vr.submitted_at,
        });
      }
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </main>
    );
  }

  if (error || !bid) {
    return (
      <main className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || "Bid not found"}
          </div>
          <Link href="/customer" className="text-sm text-indigo-500 hover:text-indigo-700 mt-4 inline-block">&larr; Back to Dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/customer" className="text-sm text-indigo-500 hover:text-indigo-700 mb-4 inline-block">&larr; Back to Dashboard</Link>

        {/* Bid Info */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-200 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{bid.title}</h1>
          <p className="text-gray-500 mt-2">{bid.description}</p>
          <p className="text-sm text-gray-400 mt-2">Deadline: {new Date(bid.deadline).toLocaleDateString()}</p>
          <p className="text-sm text-gray-400 mt-1">{bid.vendor_responses?.length || 0} vendor response(s)</p>
        </div>

        {/* Parameter Selection */}
        {bid.parameters && bid.parameters.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Parameters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bid.parameters.map((param) => (
                <div key={param.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{param.name}</label>
                  <select
                    value={selections[param.name] || ""}
                    onChange={(e) =>
                      setSelections({ ...selections, [param.name]: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="">-- Select {param.name} --</option>
                    {param.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Table */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Vendor Prices</h2>

          {!allSelected && bid.parameters && bid.parameters.length > 0 && (
            <p className="text-gray-400 text-sm">Please select all parameters above to view vendor prices.</p>
          )}

          {allSelected && (
            <>
              {matchingPrices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-600">Vendor Name</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-600">Price</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-600">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchingPrices
                        .sort((a, b) => a.price - b.price)
                        .map((r, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="py-3 px-2 text-gray-800">{r.vendor_name}</td>
                            <td className="py-3 px-2 text-gray-800 font-medium">${Number(r.price).toFixed(2)}</td>
                            <td className="py-3 px-2 text-gray-400">{new Date(r.submitted_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No vendor prices for this combination yet.</p>
              )}
            </>
          )}

          {(!bid.parameters || bid.parameters.length === 0) && (
            <p className="text-gray-400 text-sm">
              {bid.vendor_responses?.length > 0
                ? `${bid.vendor_responses.length} vendor(s) responded.`
                : "No vendor responses yet."}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
