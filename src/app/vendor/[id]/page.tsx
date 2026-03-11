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

type PricingMode = "combination" | "additive";

interface CombinationRow {
  combination: Record<string, string>;
  combinationKey: string;
  price: string;
}

interface AdditiveRow {
  paramName: string;
  option: string;
  key: string;
  addition: string;
}

interface DiscountRule {
  id: string;
  conditionParam: string;
  conditionOption: string;
  targetType: "param_option" | "total";
  targetParam: string;
  targetOption: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
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

function makeAdditiveKey(paramName: string, option: string): string {
  return JSON.stringify({ param: paramName, option });
}

export default function VendorBidPage() {
  const params = useParams();
  const id = params.id as string;

  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState("");
  const [pricingMode, setPricingMode] = useState<PricingMode>("combination");
  const [combinationRows, setCombinationRows] = useState<CombinationRow[]>([]);
  const [additiveRows, setAdditiveRows] = useState<AdditiveRow[]>([]);
  const [basePrice, setBasePrice] = useState("");
  const [rules, setRules] = useState<DiscountRule[]>([]);
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
        const parameters: Parameter[] = data.parameters || [];

        const combos = generateCombinations(parameters);
        setCombinationRows(
          combos.map((combo) => ({
            combination: combo,
            combinationKey: makeCombinationKey(combo),
            price: "",
          }))
        );

        const addRows: AdditiveRow[] = [];
        for (const param of parameters) {
          for (const option of param.options) {
            addRows.push({
              paramName: param.name,
              option,
              key: makeAdditiveKey(param.name, option),
              addition: "",
            });
          }
        }
        setAdditiveRows(addRows);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const totalOptions = bid?.parameters?.reduce((sum, p) => sum + p.options.length, 0) ?? 0;
  const totalCombinations = combinationRows.length;

  const updateCombinationPrice = (index: number, value: string) => {
    const updated = [...combinationRows];
    updated[index] = { ...updated[index], price: value };
    setCombinationRows(updated);
  };

  const updateAdditiveAddition = (index: number, value: string) => {
    const updated = [...additiveRows];
    updated[index] = { ...updated[index], addition: value };
    setAdditiveRows(updated);
  };

  const addRule = () => {
    const firstParam = bid?.parameters?.[0];
    setRules([
      ...rules,
      {
        id: crypto.randomUUID(),
        conditionParam: firstParam?.name || "",
        conditionOption: firstParam?.options?.[0] || "",
        targetType: "total",
        targetParam: "",
        targetOption: "",
        discountType: "percentage",
        discountValue: "",
      },
    ]);
  };

  const updateRule = (index: number, updates: Partial<DiscountRule>) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], ...updates };
    setRules(updated);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (pricingMode === "combination") {
        const prices = combinationRows
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
            pricing_mode: "combination",
            prices,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to submit prices");
        }
      } else {
        if (!basePrice) {
          throw new Error("Please enter a base price");
        }

        const prices = additiveRows
          .filter((r) => r.addition !== "")
          .map((r) => ({
            combination_key: r.key,
            price: parseFloat(r.addition),
          }));

        const serializedRules = rules
          .filter((r) => r.discountValue !== "")
          .map((r) => ({
            conditionParam: r.conditionParam,
            conditionOption: r.conditionOption,
            targetType: r.targetType,
            targetParam: r.targetParam,
            targetOption: r.targetOption,
            discountType: r.discountType,
            discountValue: parseFloat(r.discountValue),
          }));

        const res = await fetch(`/api/bids/${id}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendor_name: vendorName,
            pricing_mode: "additive",
            base_price: parseFloat(basePrice),
            prices,
            rules: serializedRules.length > 0 ? serializedRules : undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to submit prices");
        }
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
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

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--gold)';
    e.currentTarget.style.background = '#fff';
    e.currentTarget.style.boxShadow = '0 0 0 3px var(--gold-bg)';
  };
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--border)';
    e.currentTarget.style.background = 'var(--bg)';
    e.currentTarget.style.boxShadow = 'none';
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--gold-b)', borderTopColor: 'var(--gold)' }}></div>
      </main>
    );
  }

  if (error && !bid) {
    return (
      <main className="min-h-screen py-10 px-4" style={{ background: 'var(--bg)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="px-4 py-3 text-sm" style={{ background: 'var(--red-bg)', border: '1px solid var(--red-b)', borderRadius: '8px', color: 'var(--red)' }}>
            {error}
          </div>
          <Link href="/vendor" className="text-sm mt-4 inline-block" style={{ color: 'var(--gold)' }}>&larr; Back to Dashboard</Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-md w-full p-10" style={{ background: 'var(--card)', border: '1.5px solid var(--green-b)', borderRadius: '12px' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl" style={{ background: 'var(--green-bg)', border: '2px solid var(--green-b)' }}>
            ✓
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--green)' }}>Bid Submitted!</h2>
          <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>Your prices have been successfully submitted.</p>
          <Link
            href="/vendor"
            className="inline-block text-white px-6 py-2.5 font-bold text-sm transition-all"
            style={{ background: 'var(--gold)', borderRadius: '7px' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--gold-l)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--gold)'; }}
          >
            Back to Vendor Portal
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-10 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/vendor" className="text-sm mb-4 inline-block transition-colors" style={{ color: 'var(--gold)' }}>&larr; Back to Portal</Link>

        {/* Bid Info */}
        <div className="mb-6 overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div className="p-5">
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--ink)' }}>{bid?.title}</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{bid?.description}</p>
            <div className="mt-3">
              <span className="text-xs font-bold px-2 py-0.5" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-b)', borderRadius: '100px' }}>
                Deadline: {bid ? new Date(bid.deadline).toLocaleDateString() : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Attached Files */}
        {bid?.files && bid.files.length > 0 && (
          <div className="mb-6 overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-bold text-sm" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--ink)' }}>Attached Files</h2>
            </div>
            <div className="p-5 space-y-2">
              {bid.files.map((file) => (
                <a
                  key={file.id}
                  href={`/api/bids/${id}/files/${file.id}`}
                  download
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-all"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--ink)' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink)'; }}
                >
                  📄 {file.filename}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-4 py-3 mb-6 text-sm" style={{ background: 'var(--red-bg)', border: '1px solid var(--red-b)', borderRadius: '8px', color: 'var(--red)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vendor Name */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border)' }}>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink2)' }}>Your Company Name</label>
            </div>
            <div className="p-5">
              <input
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
                placeholder="Enter your company name"
              />
            </div>
          </div>

          {/* Pricing Mode Toggle */}
          {bid?.parameters && bid.parameters.length > 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-bold text-sm" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--ink)' }}>Pricing Mode</h2>
              </div>
              <div className="p-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPricingMode("combination")}
                  className="flex-1 py-3 px-4 text-sm font-semibold transition-all text-left"
                  style={{
                    borderRadius: '10px',
                    border: pricingMode === "combination" ? '2px solid var(--gold)' : '1.5px solid var(--border)',
                    background: pricingMode === "combination" ? 'var(--gold-bg)' : 'var(--bg)',
                    color: pricingMode === "combination" ? 'var(--gold)' : 'var(--ink2)',
                  }}
                >
                  <div className="font-bold">Combination</div>
                  <div className="text-xs mt-1 opacity-75">
                    Unique price per combination ({totalCombinations} prices)
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPricingMode("additive")}
                  className="flex-1 py-3 px-4 text-sm font-semibold transition-all text-left"
                  style={{
                    borderRadius: '10px',
                    border: pricingMode === "additive" ? '2px solid var(--gold)' : '1.5px solid var(--border)',
                    background: pricingMode === "additive" ? 'var(--gold-bg)' : 'var(--bg)',
                    color: pricingMode === "additive" ? 'var(--gold)' : 'var(--ink2)',
                  }}
                >
                  <div className="font-bold">Additive</div>
                  <div className="text-xs mt-1 opacity-75">
                    Base price + per-option additions ({totalOptions} prices)
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Combination Price Grid */}
          {pricingMode === "combination" && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-bold text-sm" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--ink)' }}>Price Grid</h2>
              </div>
              <div className="p-5">
                {combinationRows.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--faint)' }}>This bid has no parameters. No price grid to fill.</p>
                )}

                {combinationRows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                          {bid?.parameters?.map((p) => (
                            <th key={p.name} className="text-left py-2.5 px-3" style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' }}>
                              {p.name}
                            </th>
                          ))}
                          <th className="text-left py-2.5 px-3" style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' }}>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {combinationRows.map((row, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}
                            onMouseOver={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--gold-bg)'; }}
                            onMouseOut={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                          >
                            {bid?.parameters?.map((p) => (
                              <td key={p.name} className="py-2 px-3 text-sm" style={{ color: 'var(--ink2)' }}>
                                {row.combination[p.name]}
                              </td>
                            ))}
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={row.price}
                                onChange={(e) => updateCombinationPrice(index, e.target.value)}
                                style={{ ...inputStyle, width: '120px', padding: '7px 11px' }}
                                onFocus={focusInput}
                                onBlur={blurInput}
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
            </div>
          )}

          {/* Additive Pricing */}
          {pricingMode === "additive" && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-bold text-sm" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--ink)' }}>Additive Pricing</h2>
              </div>
              <div className="p-5">
                <p className="text-sm mb-4" style={{ color: 'var(--faint)' }}>
                  Set a base price, then specify how much each option adds to the total.
                </p>

                {/* Base Price */}
                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ink2)' }}>Base Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    style={{ ...inputStyle, width: '180px' }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                    placeholder="0.00"
                  />
                </div>

                {/* Per-option additions grouped by parameter */}
                {bid?.parameters?.map((param) => (
                  <div key={param.name} className="mb-6 last:mb-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ink2)' }}>{param.name}</h3>
                    <div className="space-y-2">
                      {param.options.map((option) => {
                        const rowIndex = additiveRows.findIndex(
                          (r) => r.paramName === param.name && r.option === option
                        );
                        if (rowIndex === -1) return null;
                        return (
                          <div key={option} className="flex items-center gap-3">
                            <span className="text-sm w-40" style={{ color: 'var(--ink2)' }}>{option}</span>
                            <span className="text-sm" style={{ color: 'var(--faint)' }}>+</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={additiveRows[rowIndex].addition}
                              onChange={(e) => updateAdditiveAddition(rowIndex, e.target.value)}
                              style={{ ...inputStyle, width: '120px', padding: '7px 11px' }}
                              onFocus={focusInput}
                              onBlur={blurInput}
                              placeholder="0.00"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditional Discount Rules */}
          {pricingMode === "additive" && bid?.parameters && bid.parameters.length > 1 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border)' }}>
                <div className="flex-1">
                  <h2 className="font-bold text-sm" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--ink)' }}>Conditional Discounts</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--faint)' }}>Optional: define discounts when specific options are selected.</p>
                </div>
                <button
                  type="button"
                  onClick={addRule}
                  className="text-xs font-bold px-3 py-1.5 transition-all"
                  style={{ background: 'transparent', border: '1.5px solid var(--border2)', borderRadius: '7px', color: 'var(--ink2)' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.background = 'var(--gold-bg)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--ink2)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  + Add Rule
                </button>
              </div>
              <div className="p-5">
                {rules.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--faint)' }}>No discount rules added.</p>
                )}

                <div className="space-y-4">
                  {rules.map((rule, ruleIndex) => (
                    <div key={rule.id} className="p-4" style={{ border: '1.5px solid var(--border)', borderRadius: '10px', background: 'var(--bg)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--gold)' }}>Rule {ruleIndex + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeRule(ruleIndex)}
                          className="text-xs font-semibold"
                          style={{ color: 'var(--red)' }}
                        >
                          Remove
                        </button>
                      </div>

                      {/* Condition */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-sm font-semibold" style={{ color: 'var(--ink2)' }}>When</span>
                        <select
                          value={rule.conditionParam}
                          onChange={(e) => {
                            const param = bid.parameters.find((p) => p.name === e.target.value);
                            updateRule(ruleIndex, {
                              conditionParam: e.target.value,
                              conditionOption: param?.options?.[0] || "",
                            });
                          }}
                          style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: '0.82rem' }}
                          onFocus={focusInput}
                          onBlur={blurInput}
                        >
                          {bid.parameters.map((p) => (
                            <option key={p.name} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                        <span className="text-sm" style={{ color: 'var(--muted)' }}>=</span>
                        <select
                          value={rule.conditionOption}
                          onChange={(e) => updateRule(ruleIndex, { conditionOption: e.target.value })}
                          style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: '0.82rem' }}
                          onFocus={focusInput}
                          onBlur={blurInput}
                        >
                          {bid.parameters
                            .find((p) => p.name === rule.conditionParam)
                            ?.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                      </div>

                      {/* Target */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-sm font-semibold" style={{ color: 'var(--ink2)' }}>Then</span>
                        <select
                          value={rule.targetType}
                          onChange={(e) => {
                            const targetType = e.target.value as "total" | "param_option";
                            if (targetType === "total") {
                              updateRule(ruleIndex, { targetType, targetParam: "", targetOption: "" });
                            } else {
                              const otherParams = bid.parameters.filter((p) => p.name !== rule.conditionParam);
                              const first = otherParams[0];
                              updateRule(ruleIndex, {
                                targetType,
                                targetParam: first?.name || "",
                                targetOption: first?.options?.[0] || "",
                              });
                            }
                          }}
                          style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: '0.82rem' }}
                          onFocus={focusInput}
                          onBlur={blurInput}
                        >
                          <option value="total">total price</option>
                          <option value="param_option">specific option</option>
                        </select>

                        {rule.targetType === "param_option" && (
                          <>
                            <select
                              value={rule.targetParam}
                              onChange={(e) => {
                                const param = bid.parameters.find((p) => p.name === e.target.value);
                                updateRule(ruleIndex, {
                                  targetParam: e.target.value,
                                  targetOption: param?.options?.[0] || "",
                                });
                              }}
                              style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: '0.82rem' }}
                              onFocus={focusInput}
                              onBlur={blurInput}
                            >
                              {bid.parameters
                                .filter((p) => p.name !== rule.conditionParam)
                                .map((p) => (
                                  <option key={p.name} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                            <span className="text-sm" style={{ color: 'var(--muted)' }}>=</span>
                            <select
                              value={rule.targetOption}
                              onChange={(e) => updateRule(ruleIndex, { targetOption: e.target.value })}
                              style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: '0.82rem' }}
                              onFocus={focusInput}
                              onBlur={blurInput}
                            >
                              {bid.parameters
                                .find((p) => p.name === rule.targetParam)
                                ?.options.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                          </>
                        )}
                      </div>

                      {/* Discount */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: 'var(--ink2)' }}>gets</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={rule.discountValue}
                          onChange={(e) => updateRule(ruleIndex, { discountValue: e.target.value })}
                          style={{ ...inputStyle, width: '90px', padding: '6px 10px', fontSize: '0.82rem' }}
                          onFocus={focusInput}
                          onBlur={blurInput}
                          placeholder="0"
                        />
                        <select
                          value={rule.discountType}
                          onChange={(e) => updateRule(ruleIndex, { discountType: e.target.value as "percentage" | "fixed" })}
                          style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: '0.82rem' }}
                          onFocus={focusInput}
                          onBlur={blurInput}
                        >
                          <option value="percentage">% off</option>
                          <option value="fixed">$ off</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white py-3 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--gold)', borderRadius: '7px', border: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.9rem' }}
            onMouseOver={(e) => { if (!submitting) { e.currentTarget.style.background = 'var(--gold-l)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(232,146,10,0.3)'; } }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {submitting ? "Submitting..." : "Submit Prices"}
          </button>
        </form>
      </div>
    </main>
  );
}
