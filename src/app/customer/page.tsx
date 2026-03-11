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

function showToast(msg: string) {
  const el = document.getElementById("bm-toast");
  if (!el) return;
  el.textContent = msg;
  el.style.opacity = "1";
  el.style.transform = "translateY(0)";
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
  }, 2200);
}

export default function CustomerDashboard() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/bids")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch bids");
        return res.json();
      })
      .then((data) => {
        setBids(data);
        const init: Record<string, boolean> = {};
        data.forEach((b: Bid) => {
          init[b.id] = true;
        });
        setOpenAccordions(init);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    bids.forEach((b) => {
      next[b.id] = true;
    });
    setOpenAccordions(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    bids.forEach((b) => {
      next[b.id] = false;
    });
    setOpenAccordions(next);
  };

  const totalBids = bids.length;
  const totalResponses = bids.reduce((s, b) => s + (b.vendor_response_count ?? 0), 0);
  const responseRate = totalBids > 0 ? Math.round((totalResponses / (totalBids * 10)) * 100) : 0;

  const activityFeed = [
    { icon: "\uD83D\uDCE5", bg: "var(--green-bg)", color: "var(--green)", text: "<strong>BrooklynMill</strong> submitted a bid — Kitchens", time: "2 min ago" },
    { icon: "\uD83C\uDFC6", bg: "var(--gold-bg)", color: "var(--gold)", text: "Winner selected: <strong>ManhattanCab Co.</strong> – Flooring", time: "1 hr ago" },
    { icon: "\uD83D\uDCE8", bg: "var(--blue-bg)", color: "var(--blue)", text: "Bid request sent to <strong>8 vendors</strong> — MEP", time: "3 hrs ago" },
    { icon: "\u23F0", bg: "var(--red-bg)", color: "var(--red)", text: "Auto-reminder sent to <strong>3 vendors</strong>", time: "Yesterday 4:30 PM" },
    { icon: "\uD83D\uDCE5", bg: "var(--green-bg)", color: "var(--green)", text: "<strong>TriState Imports</strong> submitted 2 options", time: "Yesterday 2:15 PM" },
  ];

  if (loading) {
    return (
      <div className="scroll" style={{ display: "flex", justifyContent: "center", paddingTop: "80px" }}>
        <div style={{ width: "32px", height: "32px", border: "4px solid var(--gold-b)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scroll" style={{ padding: "20px" }}>
        <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "8px", padding: "12px 16px", color: "var(--red)", fontSize: "0.85rem" }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="page on" style={{ display: "block" }}>
      <div className="fstrip">
        <div className="fs-search">
          <span style={{ color: "var(--faint)" }}>{"\uD83D\uDD0D"}</span>
          <input placeholder="Search projects\u2026" />
        </div>
        <div className="chip on" onClick={() => showToast("Filter: All")}>All</div>
        <div className="chip green" onClick={() => showToast("Filter: Active")}>{"\uD83D\uDFE2"} Active</div>
        <div className="chip" onClick={() => showToast("Filter: Pending")}>{"\uD83D\uDFE1"} Pending</div>
        <div className="chip blue" onClick={() => showToast("Filter: Draft")}>{"\uD83D\uDCCB"} Draft</div>
        <div className="chip red" onClick={() => showToast("Filter: Overdue")}>{"\u23F0"} Overdue</div>
        <div className="fright">
          <select className="sort-sel">
            <option>Sort: Deadline {"\u2191"}</option>
            <option>Sort: Bids {"\u2193"}</option>
            <option>Sort: Recent</option>
          </select>
        </div>
      </div>
      <div className="scroll">
        <div className="kpi-row">
          <div className="kpi" style={{ "--kc": "var(--gold)" } as React.CSSProperties}>
            <span className="kpi-icon">{"\uD83D\uDCC1"}</span>
            <div className="kpi-lbl">Active Bids</div>
            <div className="kpi-val">{totalBids}</div>
            <div className="kpi-sub">{"\u2191"} this month</div>
          </div>
          <div className="kpi" style={{ "--kc": "var(--blue)" } as React.CSSProperties}>
            <span className="kpi-icon">{"\uD83D\uDCE8"}</span>
            <div className="kpi-lbl">Open Bid Requests</div>
            <div className="kpi-val">{totalBids}</div>
            <div className="kpi-sub">{"\u2191"} new this week</div>
          </div>
          <div className="kpi" style={{ "--kc": "var(--green)" } as React.CSSProperties}>
            <span className="kpi-icon">{"\uD83D\uDCE5"}</span>
            <div className="kpi-lbl">Bids Received</div>
            <div className="kpi-val">{totalResponses}</div>
            <div className="kpi-sub">{responseRate}% response rate</div>
          </div>
          <div className="kpi" style={{ "--kc": "var(--cyan)" } as React.CSSProperties}>
            <span className="kpi-icon">{"\uD83D\uDCB0"}</span>
            <div className="kpi-lbl">Response Rate</div>
            <div className="kpi-val">
              {responseRate}
              <span style={{ fontSize: "1.1rem" }}>%</span>
            </div>
            <div className="kpi-sub">across all bids</div>
          </div>
        </div>

        <div className="dash-grid">
          <div className="scard">
            <div className="scard-head" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <h3>Active Projects &amp; Bid Requests</h3>
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                <button className="btn btn-outline btn-xs" onClick={expandAll} style={{ fontSize: "0.7rem" }}>
                  {"\u25BC"} Expand All
                </button>
                <button className="btn btn-outline btn-xs" onClick={collapseAll} style={{ fontSize: "0.7rem" }}>
                  {"\u25B6"} Collapse All
                </button>
              </div>
            </div>

            {bids.length === 0 && (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--muted)", fontSize: "0.88rem" }}>
                No bids yet. Create your first bid request to get started.
              </div>
            )}

            {bids.map((bid) => {
              const isOpen = openAccordions[bid.id];
              const respCount = bid.vendor_response_count ?? 0;
              return (
                <div className="pacc-item" key={bid.id}>
                  <div className="pacc-hdr" onClick={() => toggleAccordion(bid.id)}>
                    <span className={`pacc-arrow${isOpen ? " open" : ""}`}>{"\u25B6"}</span>
                    <span>{"\uD83D\uDCC1"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "var(--ink)" }}>
                        {bid.title}
                      </div>
                      <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                        <span className="pacc-pill" style={{ background: "var(--gold-bg)", color: "var(--gold)", borderColor: "var(--gold-b)" }}>
                          {respCount} response{respCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <span className="tag tag-active" style={{ flexShrink: 0 }}>Active</span>
                  </div>
                  <div className={`pacc-body${isOpen ? " open" : ""}`}>
                    <table className="proj-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ paddingLeft: "28px" }}>Bid Request</th>
                          <th>Status</th>
                          <th>Bids</th>
                          <th>Deadline</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div className="pname" style={{ paddingLeft: "16px" }}>
                              {"\u21B3"} {bid.title}
                            </div>
                            <div className="psub" style={{ paddingLeft: "16px" }}>
                              {bid.description ? bid.description.substring(0, 40) : "No description"}
                            </div>
                          </td>
                          <td>
                            <span className="tag tag-active">Active</span>
                          </td>
                          <td>
                            <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{respCount}</div>
                            <div className="pbar">
                              <div
                                className="pbar-fill"
                                style={{
                                  width: `${Math.min(100, respCount * 20)}%`,
                                  background: "var(--gold)",
                                }}
                              ></div>
                            </div>
                          </td>
                          <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                            {new Date(bid.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </td>
                          <td>
                            <Link href={`/customer/${bid.id}`} className="btn btn-gold btn-xs">
                              Compare {"\u2192"}
                            </Link>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Activity Feed */}
          <div className="scard">
            <div className="scard-head">
              <h3>Activity Feed</h3>
            </div>
            {activityFeed.map((item, i) => (
              <div className="act" key={i}>
                <div className="act-ico" style={{ background: item.bg, color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <div className="act-t" dangerouslySetInnerHTML={{ __html: item.text }} />
                  <div className="act-time">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
