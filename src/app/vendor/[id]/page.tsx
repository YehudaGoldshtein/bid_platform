"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Parameter {
  name: string;
  options: string[];
}

interface BidFile {
  id: string;
  filename: string;
}

interface Bid {
  id: string;
  title: string;
  description: string;
  deadline: string;
  parameters: Parameter[];
  files: BidFile[];
}

interface CombinationRow {
  combination: Record<string, string>;
  combinationKey: string;
  price: string;
}

function generateCombinations(parameters: Parameter[]): Record<string, string>[] {
  if (parameters.length === 0) return [{}];

  const [first, ...rest] = parameters;
  const restCombinations = generateCombinations(rest);
  const results: Record<string, string>[] = [];

  for (const option of first.options) {
    for (const combo of restCombinations) {
      results.push({ [first.name]: option, ...combo });
    }
  }

  return results;
}

function makeCombinationKey(combo: Record<string, string>): string {
  const sorted = Object.keys(combo).sort().reduce((acc: Record<string, string>, key) => {
    acc[key] = combo[key];
    return acc;
  }, {});
  return JSON.stringify(sorted);
}

export default function VendorBidPage() {
  const params = useParams();
  const id = params.id as string;

  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState("");
  const [rows, setRows] = useState<CombinationRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/bids/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch bid");
        return res.json();
      })
      .then((data) => {
        setBid(data);
        const combos = generateCombinations(data.parameters || []);
        setRows(
          combos.map((combo) => ({
            combination: combo,
            combinationKey: makeCombinationKey(combo),
            price: "",
          }))
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const updatePrice = (index: number, value: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], price: value };
    setRows(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const prices = rows
        .filter((r) => r.price !== "")
        .map((r) => ({
          combination_key: r.combinationKey,
          price: parseFloat(r.price),
        }));

      if (prices.length === 0) {
        throw new Error("Please enter at least one price");
      }

      const res = await fetch(`/api/bids/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_name: vendorName,
          prices,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit prices");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </main>
    );
  }

  if (error && !bid) {
    return (
      <main className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
          <Link href="/vendor" className="text-sm text-indigo-500 hover:text-indigo-700 mt-4 inline-block">&larr; Back to Dashboard</Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-10 border border-gray-200 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Prices Submitted!</h2>
          <p className="text-gray-500 mb-6">Your prices have been successfully submitted.</p>
          <Link
            href="/vendor"
            className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Back to Vendor Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/vendor" className="text-sm text-indigo-500 hover:text-indigo-700 mb-4 inline-block">&larr; Back to Dashboard</Link>

        {/* Bid Info */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-200 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{bid?.title}</h1>
          <p className="text-gray-500 mt-2">{bid?.description}</p>
          <p className="text-sm text-gray-400 mt-2">Deadline: {bid ? new Date(bid.deadline).toLocaleDateString() : ""}</p>
        </div>

        {/* Attached Files */}
        {bid?.files && bid.files.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Attached Files</h2>
            <ul className="space-y-2">
              {bid.files.map((file) => (
                <li key={file.id}>
                  <a
                    href={`/api/bids/${id}/files/${file.id}`}
                    className="text-indigo-600 hover:text-indigo-800 text-sm underline"
                    download
                  >
                    {file.filename}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Price Form */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vendor Name */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Company Name</label>
            <input
              type="text"
              required
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your company name"
            />
          </div>

          {/* Price Grid */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Price Grid</h2>

            {rows.length === 0 && (
              <p className="text-gray-400 text-sm">This bid has no parameters. No price grid to fill.</p>
            )}

            {rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {bid?.parameters?.map((p) => (
                        <th key={p.name} className="text-left py-3 px-2 font-medium text-gray-600">
                          {p.name}
                        </th>
                      ))}
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        {bid?.parameters?.map((p) => (
                          <td key={p.name} className="py-2 px-2 text-gray-700">
                            {row.combination[p.name]}
                          </td>
                        ))}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.price}
                            onChange={(e) => updatePrice(index, e.target.value)}
                            className="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Prices"}
          </button>
        </form>
      </div>
    </main>
  );
}
