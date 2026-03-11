"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface Bid {
  id: string;
  title: string;
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

const DOT_COLORS = [
  "var(--green)",
  "var(--gold)",
  "var(--blue)",
  "var(--cyan)",
  "var(--red)",
];

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    fetch("/api/bids")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBids(data))
      .catch(() => {});
  }, []);

  const pageTitle = (() => {
    if (pathname === "/customer") return "Dashboard";
    if (pathname === "/customer/create") return "Create Bid Request";
    if (pathname?.startsWith("/customer/vendors")) return "Vendors";
    if (pathname?.startsWith("/customer/settings")) return "Settings";
    if (pathname?.startsWith("/customer/new-project")) return "New Project";
    if (pathname?.match(/^\/customer\/[^/]+$/)) return "Compare Bids";
    return "Dashboard";
  })();

  const pageSub = pathname === "/customer" ? "Welcome back, James" : "";

  const navItems = [
    { label: "Dashboard", icon: "\u25A6", href: "/customer" },
    { label: "Compare Bids", icon: "\u2696", href: "/customer", badge: String(bids.length) },
    { label: "Vendors", icon: "\uD83D\uDC65", href: "/customer/vendors" },
    { label: "Settings", icon: "\u2699\uFE0F", href: "/customer/settings" },
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo-bar">
          <div className="logo-text">
            Bid<em>Master</em>
          </div>
          <div className="logo-badge">PRO</div>
        </div>

        <div className="sidebar-scroll">
          <div className="nav-section">
            <div className="nav-section-label">Main</div>
            {navItems.map((item) => {
              const isActive =
                item.label === "Dashboard"
                  ? pathname === "/customer"
                  : item.label === "Compare Bids"
                  ? pathname?.match(/^\/customer\/[^/]+$/) && pathname !== "/customer/create" && pathname !== "/customer/vendors" && pathname !== "/customer/settings" && pathname !== "/customer/new-project"
                  : pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`nav-item${isActive ? " active" : ""}`}
                >
                  <span className="ni">{item.icon}</span> {item.label}
                  {item.badge && (
                    <span className="nbadge">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>

          <Link href="/customer/new-project" className="add-proj-btn">
            <span style={{ fontSize: "1.1rem" }}>{"\uFF0B"}</span> New Project
          </Link>

          <div className="nav-section">
            <div className="nav-section-label">Projects</div>
          </div>

          {bids.map((bid, i) => (
            <div className="proj-tree" key={bid.id}>
              <Link
                href={`/customer/${bid.id}`}
                className="proj-header"
                style={{ textDecoration: "none" }}
              >
                <span
                  className="proj-dot"
                  style={{ background: DOT_COLORS[i % DOT_COLORS.length] }}
                ></span>
                <span className="proj-header-name">{bid.title}</span>
                <span className="proj-status-pill psp-active">Active</span>
              </Link>
            </div>
          ))}
        </div>

        <div className="sidebar-foot">
          <div className="user-chip">
            <div className="avatar">JR</div>
            <div>
              <div className="u-name">James Robertson</div>
              <div className="u-role">Procurement Director</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div>
            <span className="page-heading">{pageTitle}</span>
            {pageSub && <span className="page-sub">{pageSub}</span>}
          </div>
          <div className="topbar-right">
            <div className="gsearch">
              <span style={{ color: "var(--faint)", fontSize: "0.85rem" }}>
                {"\uD83D\uDD0D"}
              </span>
              <input placeholder="Search projects, vendors, bids\u2026" />
              <span
                style={{
                  fontSize: "0.67rem",
                  color: "var(--faint)",
                  background: "var(--border)",
                  borderRadius: "4px",
                  padding: "2px 5px",
                }}
              >
                {"\u2318"}K
              </span>
            </div>
            <div className="ibtn" onClick={() => showToast("No new notifications")}>
              {"\uD83D\uDD14"}
              <span className="notif-pip"></span>
            </div>
            <div className="ibtn" onClick={() => showToast("Settings coming soon")}>
              {"\u2699\uFE0F"}
            </div>
            <Link href="/customer/create" className="btn btn-gold btn-xs">
              {"\uFF0B"} New Bid Request
            </Link>
          </div>
        </div>

        <div className="content">{children}</div>
      </div>

      {/* Toast */}
      <div
        id="bm-toast"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: "var(--ink)",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: "10px",
          fontSize: "0.84rem",
          fontWeight: 700,
          opacity: 0,
          transform: "translateY(12px)",
          transition: "opacity 0.25s, transform 0.25s",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
