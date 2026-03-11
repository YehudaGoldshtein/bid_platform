"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Parameter {
  name: string;
  options: string[];
}

interface DiscountRule {
  conditionParam: string;
  conditionOption: string;
  targetType: "param_option" | "total";
  targetParam: string;
  targetOption: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
}

interface VendorResponse {
  vendor_name: string;
  submitted_at: string;
  pricing_mode: "combination" | "additive";
  base_price: number | null;
  rules: DiscountRule[];
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
  pricing_mode: string;
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

  const matchingPrices: MatchedPrice[] = [];
  if (allSelected && bid?.vendor_responses) {
    for (const vr of bid.vendor_responses) {
      if (vr.pricing_mode === "additive") {
        let total = vr.base_price ?? 0;
        let allFound = true;

        const optionAdditions: Record<string, number> = {};
        for (const [paramName, optionValue] of Object.entries(selections)) {
          const key = JSON.stringify({ param: paramName, option: optionValue });
          const match = vr.prices.find((p) => p.combination_key === key);
          if (match) {
            optionAdditions[key] = match.price;
            total += match.price;
          } else {
            allFound = false;
          }
        }

        if (allFound && vr.rules && vr.rules.length > 0) {
          for (const rule of vr.rules) {
            if (selections[rule.conditionParam] !== rule.conditionOption) continue;

            if (rule.targetType === "total") {
              if (rule.discountType === "percentage") {
                total -= total * (rule.discountValue / 100);
              } else {
                total -= rule.discountValue;
              }
            } else if (rule.targetType === "param_option") {
              if (selections[rule.targetParam] === rule.targetOption) {
                const targetKey = JSON.stringify({ param: rule.targetParam, option: rule.targetOption });
                const addition = optionAdditions[targetKey] ?? 0;
                if (rule.discountType === "percentage") {
                  total -= addition * (rule.discountValue / 100);
                } else {
                  total -= rule.discountValue;
                }
              }
            }
          }
        }

        if (allFound) {
          matchingPrices.push({
            vendor_name: vr.vendor_name,
            price: Math.max(0, total),
            submitted_at: vr.submitted_at,
            pricing_mode: "additive",
          });
        }
      } else {
        const match = vr.prices.find((p) => p.combination_key === combinationKey);
        if (match) {
          matchingPrices.push({
            vendor_name: vr.vendor_name,
            price: match.price,
            submitted_at: vr.submitted_at,
            pricing_mode: "combination",
          });
        }
      }
    }
  }

  const inputStyle = {
    background: 'var(--bg)',
    border: '1.5px solid var(--border)',
    borderRadius: '7px',
    padding: '9px 11px',
    color: 'var(--ink)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.84rem',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--gold-b)', borderTopColor: 'var(--gold)' }}></div>
      </main>
    );
  }

  if (error || !bid) {
    return (
      <main className="min-h-screen py-10 px-4" style={{ background: 'var(--bg)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="px-4 py-3 text-sm" style={{ background: 'var(--red-bg)', border: '1px solid var(--red-b)', borderRadius: '8px', color: 'var(--red)' }}>
            {error || "Bid not found"}
          </div>
          <Link href="/customer" className="text-sm mt-4 inline-block" style={{ color: 'var(--gold)' }}>&larr; Back to Dashboard</Link>
        </div>
      </main>
    );
  }

  const sortedPrices = [...matchingPrices].sort((a, b) => a.price - b.price);
  const bestPrice = sortedPrices.length > 0 ? sortedPrices[0].price : null;

  return (
    <main className="min-h-screen py-10 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/customer" className="text-sm mb-4 inline-block transition-colors" style={{ color: 'var(--gold)' }}>&larr; Back to Dashboard</Link>

        {/* Bid Info */}
        <div className="mb-6 overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div className="p-5">
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--ink)' }}>{bid.title}</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{bid.description}</p>
            <div className="flex gap-4 mt-3">
              <span className="text-xs" style={{ color: 'var(--faint)' }}>Deadline: {new Date(bid.deadline).toLocaleDateString()}</span>
              <span className="text-xs font-bold px-2 py-0.5" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-b)', borderRadius: '100px' }}>
                {bid.vendor_responses?.length || 0} response{(bid.vendor_responses?.length || 0) !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Parameter Selection */}
        {bid.parameters && bid.parameters.length > 0 && (
          <div className="mb-6 overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-bold text-sm" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--ink)' }}>Select Parameters</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bid.parameters.map((param) => (
                  <div key={param.name}>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ink2)' }}>{param.name}</label>
                    <select
                      value={selections[param.name] || ""}
                      onChange={(e) =>
                        setSelections({ ...selections, [param.name]: e.target.value })
                      }
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--gold-bg)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.boxShadow = 'none'; }}
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
          </div>
        )}

        {/* Price Table */}
        <div className="overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-bold text-sm" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--ink)' }}>Vendor Prices</h2>
          </div>
          <div className="p-5">
            {!allSelected && bid.parameters && bid.parameters.length > 0 && (
              <p className="text-sm" style={{ color: 'var(--faint)' }}>Please select all parameters above to view vendor prices.</p>
            )}

            {allSelected && (
              <>
                {sortedPrices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                          <th className="text-left py-2.5 px-3" style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' }}>Vendor</th>
                          <th className="text-left py-2.5 px-3" style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' }}>Price</th>
                          <th className="text-left py-2.5 px-3" style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' }}>Mode</th>
                          <th className="text-left py-2.5 px-3" style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' }}>Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPrices.map((r, i) => (
                          <tr key={i}
                            style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                            onMouseOver={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--gold-bg)'; }}
                            onMouseOut={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                          >
                            <td className="py-3 px-3" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--ink)' }}>{r.vendor_name}</td>
                            <td className="py-3 px-3" style={{
                              fontFamily: "'Bricolage Grotesque', sans-serif",
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: r.price === bestPrice ? 'var(--green)' : 'var(--ink)',
                            }}>
                              ${Number(r.price).toFixed(2)}
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-xs font-bold px-2 py-0.5" style={{
                                background: r.pricing_mode === "additive" ? 'var(--gold-bg)' : 'var(--blue-bg)',
                                color: r.pricing_mode === "additive" ? 'var(--gold)' : 'var(--blue)',
                                border: `1px solid ${r.pricing_mode === "additive" ? 'var(--gold-b)' : 'var(--blue-b)'}`,
                                borderRadius: '100px',
                              }}>
                                {r.pricing_mode}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-sm" style={{ color: 'var(--muted)' }}>{new Date(r.submitted_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--faint)' }}>No vendor prices for this combination yet.</p>
                )}
              </>
            )}

            {(!bid.parameters || bid.parameters.length === 0) && (
              <p className="text-sm" style={{ color: 'var(--faint)' }}>
                {bid.vendor_responses?.length > 0
                  ? `${bid.vendor_responses.length} vendor(s) responded.`
                  : "No vendor responses yet."}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
