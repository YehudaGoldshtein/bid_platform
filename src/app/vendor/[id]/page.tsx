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

function showToast(msg: string) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.style.opacity = "1";
  setTimeout(() => { el.style.opacity = "0"; }, 2200);
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

  /* ── LOADING ── */
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 400 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "4px solid var(--gold-b)", borderTopColor: "var(--gold)",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  /* ── FATAL ERROR ── */
  if (error && !bid) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{
          background: "var(--red-bg)", border: "1px solid var(--red-b)",
          borderRadius: 8, padding: "12px 16px", color: "var(--red)", fontSize: "0.82rem", marginBottom: 16,
        }}>
          {error}
        </div>
        <Link href="/vendor" className="btn btn-outline btn-sm">{"\u2190"} Back to Dashboard</Link>
      </div>
    );
  }

  /* ── SUCCESS ── */
  if (success) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 400 }}>
        <div className="scard" style={{ border: "2px solid var(--green-b)", maxWidth: 440, width: "100%", textAlign: "center" }}>
          <div className="scard-body" style={{ padding: 40 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "var(--green-bg)", border: "2px solid var(--green-b)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: "1.6rem", color: "var(--green)",
            }}>
              {"\u2713"}
            </div>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
              fontSize: "1.2rem", color: "var(--green)", marginBottom: 8,
            }}>
              Bid Submitted!
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "0.84rem", marginBottom: 24 }}>
              Your prices have been successfully submitted.
            </p>
            <Link href="/vendor" className="btn btn-gold">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN FORM ── */
  return (
    <div className="page on">
      {/* HEADER */}
      <div className="nb-header">
        <div className="nb-title">{"\u270F\uFE0F"} Submit Bid — {bid?.title}</div>
        <div className="nb-sub">{bid?.description}</div>
      </div>

      {/* BID INFO CARD */}
      <div className="fcard" style={{ marginBottom: 16 }}>
        <div className="scard">
          <div className="scard-head">
            <span className="fsect-num">1</span>
            <h3>{"\uD83D\uDCCB"} Bid Details</h3>
            <span className="tag t-pending" style={{ marginLeft: "auto" }}>
              {"\u23F0"} Deadline: {bid ? new Date(bid.deadline).toLocaleDateString() : ""}
            </span>
          </div>
          <div className="scard-body">
            <p style={{ color: "var(--muted)", fontSize: "0.84rem", marginBottom: 12 }}>{bid?.description}</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "0.78rem" }}>
              {bid?.parameters && bid.parameters.length > 0 && (
                <span style={{ color: "var(--ink2)" }}>
                  <strong>{bid.parameters.length}</strong> parameter{bid.parameters.length !== 1 ? "s" : ""}
                  {" \u00B7 "}
                  <strong>{totalCombinations}</strong> combination{totalCombinations !== 1 ? "s" : ""}
                  {" \u00B7 "}
                  <strong>{totalOptions}</strong> total option{totalOptions !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ATTACHED FILES */}
      {bid?.files && bid.files.length > 0 && (
        <div className="scard" style={{ marginBottom: 16 }}>
          <div className="scard-head">
            <h3>{"\uD83D\uDCC1"} Attached Files</h3>
          </div>
          <div className="scard-body">
            {bid.files.map((file) => (
              <a
                key={file.id}
                href={`/api/bids/${id}/files/${file.id}`}
                download
                className="afile"
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px", marginBottom: 6,
                  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 7,
                  textDecoration: "none", color: "var(--ink)", fontSize: "0.82rem",
                  transition: "border-color 0.15s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--ink)"; }}
              >
                {"\uD83D\uDCC4"} {file.filename}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div style={{
          background: "var(--red-bg)", border: "1px solid var(--red-b)",
          borderRadius: 8, padding: "12px 16px", color: "var(--red)", fontSize: "0.82rem", marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* VENDOR NAME */}
        <div className="scard" style={{ marginBottom: 16 }}>
          <div className="scard-head">
            <span className="fsect-num">2</span>
            <h3>Your Company</h3>
          </div>
          <div className="scard-body">
            <div className="fg">
              <label className="flbl">Company Name <span className="req">*</span></label>
              <input
                className="finput"
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Enter your company name"
              />
            </div>
          </div>
        </div>

        {/* PRICING MODE TOGGLE */}
        {bid?.parameters && bid.parameters.length > 0 && (
          <div className="scard" style={{ marginBottom: 16 }}>
            <div className="scard-head">
              <span className="fsect-num">3</span>
              <h3>Pricing Mode</h3>
            </div>
            <div className="scard-body">
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className={`btn ${pricingMode === "combination" ? "btn-gold" : "btn-outline"}`}
                  onClick={() => setPricingMode("combination")}
                  style={{ flex: 1, justifyContent: "center", flexDirection: "column", alignItems: "flex-start", padding: "14px 16px" }}
                >
                  <div style={{ fontWeight: 700 }}>Combination</div>
                  <div style={{ fontSize: "0.72rem", marginTop: 4, opacity: 0.85, fontWeight: 500 }}>
                    Unique price per combination ({totalCombinations} prices)
                  </div>
                </button>
                <button
                  type="button"
                  className={`btn ${pricingMode === "additive" ? "btn-gold" : "btn-outline"}`}
                  onClick={() => setPricingMode("additive")}
                  style={{ flex: 1, justifyContent: "center", flexDirection: "column", alignItems: "flex-start", padding: "14px 16px" }}
                >
                  <div style={{ fontWeight: 700 }}>Additive</div>
                  <div style={{ fontSize: "0.72rem", marginTop: 4, opacity: 0.85, fontWeight: 500 }}>
                    Base price + per-option additions ({totalOptions} prices)
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COMBINATION PRICE GRID */}
        {pricingMode === "combination" && (
          <div className="scard" style={{ marginBottom: 16 }}>
            <div className="scard-head">
              <span className="fsect-num">{bid?.parameters && bid.parameters.length > 0 ? "4" : "3"}</span>
              <h3>Price Grid</h3>
              <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--muted)" }}>
                {combinationRows.filter(r => r.price !== "").length} / {combinationRows.length} filled
              </span>
            </div>
            <div className="scard-body" style={{ padding: 0 }}>
              {combinationRows.length === 0 && (
                <div className="empty">
                  <div className="empty-txt">No parameters defined</div>
                  <div className="empty-sub">This bid has no parameters. Just enter your vendor name and submit.</div>
                </div>
              )}

              {combinationRows.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <table className="ctable" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {bid?.parameters?.map((p) => (
                          <th key={p.name} style={{
                            textAlign: "left", padding: "10px 14px",
                            fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase",
                            letterSpacing: "0.07em", color: "var(--muted)",
                            borderBottom: "2px solid var(--border)", whiteSpace: "nowrap",
                          }}>
                            {p.name}
                          </th>
                        ))}
                        <th style={{
                          textAlign: "left", padding: "10px 14px",
                          fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase",
                          letterSpacing: "0.07em", color: "var(--muted)",
                          borderBottom: "2px solid var(--border)",
                        }}>
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {combinationRows.map((row, index) => (
                        <tr
                          key={index}
                          style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                          onMouseOver={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--gold-bg)"; }}
                          onMouseOut={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                        >
                          {bid?.parameters?.map((p) => (
                            <td key={p.name} style={{ padding: "12px 14px", fontSize: "0.82rem", color: "var(--ink2)", verticalAlign: "middle" }}>
                              {row.combination[p.name]}
                            </td>
                          ))}
                          <td style={{ padding: "8px 14px", verticalAlign: "middle" }}>
                            <input
                              className="finput"
                              type="number"
                              step="0.01"
                              min="0"
                              value={row.price}
                              onChange={(e) => updateCombinationPrice(index, e.target.value)}
                              placeholder="0.00"
                              style={{ width: 130, padding: "7px 11px" }}
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

        {/* ADDITIVE PRICING */}
        {pricingMode === "additive" && (
          <div className="scard" style={{ marginBottom: 16 }}>
            <div className="scard-head">
              <span className="fsect-num">{bid?.parameters && bid.parameters.length > 0 ? "4" : "3"}</span>
              <h3>Additive Pricing</h3>
            </div>
            <div className="scard-body">
              <p style={{ color: "var(--faint)", fontSize: "0.82rem", marginBottom: 16 }}>
                Set a base price, then specify how much each option adds to the total.
              </p>

              {/* Base Price */}
              <div className="fg" style={{ marginBottom: 20 }}>
                <label className="flbl">Base Price <span className="req">*</span></label>
                <input
                  className="finput"
                  type="number"
                  step="0.01"
                  min="0"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="0.00"
                  style={{ width: 200 }}
                />
              </div>

              {/* Per-option additions grouped by parameter */}
              {bid?.parameters?.map((param) => (
                <div key={param.name} style={{ marginBottom: 20 }}>
                  <div className="divider">{param.name}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    {param.options.map((option) => {
                      const rowIndex = additiveRows.findIndex(
                        (r) => r.paramName === param.name && r.option === option
                      );
                      if (rowIndex === -1) return null;
                      return (
                        <div key={option} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: "0.82rem", color: "var(--ink2)", width: 160, flexShrink: 0 }}>{option}</span>
                          <span style={{ fontSize: "0.82rem", color: "var(--faint)" }}>+</span>
                          <input
                            className="finput"
                            type="number"
                            step="0.01"
                            min="0"
                            value={additiveRows[rowIndex].addition}
                            onChange={(e) => updateAdditiveAddition(rowIndex, e.target.value)}
                            placeholder="0.00"
                            style={{ width: 130, padding: "7px 11px" }}
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

        {/* CONDITIONAL DISCOUNT RULES */}
        {pricingMode === "additive" && bid?.parameters && bid.parameters.length > 1 && (
          <div className="scard" style={{ marginBottom: 16 }}>
            <div className="scard-head">
              <span className="fsect-num">5</span>
              <h3>Conditional Discounts</h3>
              <span style={{ fontSize: "0.72rem", color: "var(--faint)", marginLeft: 8 }}>Optional</span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={addRule}
                style={{ marginLeft: "auto" }}
              >
                + Add Rule
              </button>
            </div>
            <div className="scard-body">
              {rules.length === 0 && (
                <p style={{ color: "var(--faint)", fontSize: "0.82rem" }}>
                  No discount rules added. Click &quot;+ Add Rule&quot; to define conditional discounts.
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {rules.map((rule, ruleIndex) => (
                  <div key={rule.id} className="scard" style={{ background: "var(--bg)", margin: 0 }}>
                    <div className="scard-head" style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--gold)" }}>
                        Rule {ruleIndex + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRule(ruleIndex)}
                        style={{
                          marginLeft: "auto", background: "none", border: "none",
                          cursor: "pointer", color: "var(--red)", fontSize: "0.78rem", fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="scard-body" style={{ padding: 14 }}>
                      {/* Condition */}
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ink2)" }}>When</span>
                        <select
                          className="finput"
                          value={rule.conditionParam}
                          onChange={(e) => {
                            const param = bid.parameters.find((p) => p.name === e.target.value);
                            updateRule(ruleIndex, {
                              conditionParam: e.target.value,
                              conditionOption: param?.options?.[0] || "",
                            });
                          }}
                          style={{ width: "auto", padding: "6px 10px", fontSize: "0.82rem" }}
                        >
                          {bid.parameters.map((p) => (
                            <option key={p.name} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                        <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>=</span>
                        <select
                          className="finput"
                          value={rule.conditionOption}
                          onChange={(e) => updateRule(ruleIndex, { conditionOption: e.target.value })}
                          style={{ width: "auto", padding: "6px 10px", fontSize: "0.82rem" }}
                        >
                          {bid.parameters
                            .find((p) => p.name === rule.conditionParam)
                            ?.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                      </div>

                      {/* Target */}
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ink2)" }}>Then</span>
                        <select
                          className="finput"
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
                          style={{ width: "auto", padding: "6px 10px", fontSize: "0.82rem" }}
                        >
                          <option value="total">total price</option>
                          <option value="param_option">specific option</option>
                        </select>

                        {rule.targetType === "param_option" && (
                          <>
                            <select
                              className="finput"
                              value={rule.targetParam}
                              onChange={(e) => {
                                const param = bid.parameters.find((p) => p.name === e.target.value);
                                updateRule(ruleIndex, {
                                  targetParam: e.target.value,
                                  targetOption: param?.options?.[0] || "",
                                });
                              }}
                              style={{ width: "auto", padding: "6px 10px", fontSize: "0.82rem" }}
                            >
                              {bid.parameters
                                .filter((p) => p.name !== rule.conditionParam)
                                .map((p) => (
                                  <option key={p.name} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                            <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>=</span>
                            <select
                              className="finput"
                              value={rule.targetOption}
                              onChange={(e) => updateRule(ruleIndex, { targetOption: e.target.value })}
                              style={{ width: "auto", padding: "6px 10px", fontSize: "0.82rem" }}
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
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ink2)" }}>gets</span>
                        <input
                          className="finput"
                          type="number"
                          step="0.01"
                          min="0"
                          value={rule.discountValue}
                          onChange={(e) => updateRule(ruleIndex, { discountValue: e.target.value })}
                          placeholder="0"
                          style={{ width: 90, padding: "6px 10px", fontSize: "0.82rem" }}
                        />
                        <select
                          className="finput"
                          value={rule.discountType}
                          onChange={(e) => updateRule(ruleIndex, { discountType: e.target.value as "percentage" | "fixed" })}
                          style={{ width: "auto", padding: "6px 10px", fontSize: "0.82rem" }}
                        >
                          <option value="percentage">% off</option>
                          <option value="fixed">$ off</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBMIT */}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Link href="/vendor" className="btn btn-outline" style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-gold"
            style={{ flex: 2, justifyContent: "center", opacity: submitting ? 0.5 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Submitting..." : "\uD83D\uDE80 Submit Bid \u2192"}
          </button>
        </div>
      </form>
    </div>
  );
}
