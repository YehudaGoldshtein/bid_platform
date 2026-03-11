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

  const activeBids = bids.length;

  return (
    <div className="page on">
      {/* KPI ROW */}
      <div className="kpi-row">
        <div className="kpi" style={{ "--kc": "var(--gold)" } as React.CSSProperties}>
          <div className="kpi-lbl">Active Bids</div>
          <div className="kpi-val">{loading ? "..." : activeBids}</div>
          <div className="kpi-sub">Open for pricing</div>
        </div>
        <div className="kpi" style={{ "--kc": "var(--green)" } as React.CSSProperties}>
          <div className="kpi-lbl">Bids Won</div>
          <div className="kpi-val">2</div>
          <div className="kpi-sub win">{"\uD83C\uDFC6"} $224,000 awarded</div>
        </div>
        <div className="kpi" style={{ "--kc": "var(--blue)" } as React.CSSProperties}>
          <div className="kpi-lbl">Pending Review</div>
          <div className="kpi-val">5</div>
          <div className="kpi-sub">Awaiting contractor decision</div>
        </div>
        <div className="kpi" style={{ "--kc": "var(--purple)" } as React.CSSProperties}>
          <div className="kpi-lbl">New Invitations</div>
          <div className="kpi-val">2</div>
          <div className="kpi-sub" style={{ color: "var(--purple)", fontWeight: 700 }}>Reply by Mar 15</div>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "4px solid var(--gold-b)", borderTopColor: "var(--gold)",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div style={{
          background: "var(--red-bg)", border: "1px solid var(--red-b)",
          borderRadius: 8, padding: "12px 16px", color: "var(--red)", fontSize: "0.82rem", marginBottom: 16,
        }}>
          Error: {error}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && bids.length === 0 && (
        <div className="empty">
          <div className="empty-icon">{"\uD83D\uDCCB"}</div>
          <div className="empty-txt">No bids available at the moment.</div>
          <div className="empty-sub">Check back later for new bid requests.</div>
        </div>
      )}

      {/* OPEN INVITATIONS */}
      {!loading && !error && bids.length > 0 && (
        <div className="scard">
          <div className="scard-head">
            <h3>{"\uD83D\uDCE8"} Open Invitations — Action Required</h3>
            <span className="tag t-pending">{bids.length} pending</span>
          </div>
          <div className="scard-body" style={{ padding: 14 }}>
            {bids.map((bid) => (
              <Link
                key={bid.id}
                href={`/vendor/${bid.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="invite-card">
                  <span className="inv-icon">{"\uD83D\uDCE6"}</span>
                  <div className="inv-body">
                    <div className="inv-title">{bid.title}</div>
                    <div className="inv-sub">
                      {bid.description.length > 100
                        ? bid.description.slice(0, 100) + "..."
                        : bid.description}
                    </div>
                    <div className="inv-pills">
                      <span className="inv-pill ip-red">
                        {"\u23F0"} Deadline: {new Date(bid.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className="btn btn-gold btn-sm">Submit Bid {"\u2192"}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
