"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

function showToast(msg: string) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.style.opacity = "1";
  setTimeout(() => {
    el.style.opacity = "0";
  }, 2200);
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: "\u25A6", href: "/vendor", badge: null, badgeClass: "" },
  { label: "My Bids", icon: "\uD83D\uDCCB", href: "/vendor/my-bids", badge: "8", badgeClass: "blue" },
  { label: "Invitations", icon: "\uD83D\uDCE8", href: "/vendor", badge: "2", badgeClass: "" },
  { label: "Submit Bid", icon: "\u270F\uFE0F", href: "__void__", badge: null, badgeClass: "" },
];

const NAV_RESULTS = [
  { label: "Won Bids", icon: "\uD83C\uDFC6", href: "__void__", badge: "2", badgeClass: "green" },
  { label: "All History", icon: "\uD83D\uDDC2", href: "__void__", badge: null, badgeClass: "" },
];

const NAV_ACCOUNT = [
  { label: "My Profile", icon: "\uD83D\uDC64", href: "/vendor/profile", badge: null, badgeClass: "" },
];

const PAGE_TITLES: Record<string, [string, string]> = {
  "/vendor": ["Dashboard", "Welcome back, Acme Supply Co. \uD83D\uDC4B"],
  "/vendor/my-bids": ["My Bids", "All submitted bids"],
  "/vendor/profile": ["My Profile", "Company & contact info"],
};

export default function VendorLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Check if we're on a bid detail page
  const isBidDetail = pathname.startsWith("/vendor/") && pathname !== "/vendor" && pathname !== "/vendor/my-bids" && pathname !== "/vendor/profile" && pathname !== "/vendor/won" && pathname !== "/vendor/history";

  const [pageTitle, pageSub] = isBidDetail
    ? ["Submit Bid", "Fill in your pricing and submit"]
    : PAGE_TITLES[pathname] || ["Vendor Portal", ""];

  function renderNavItem(item: { label: string; icon: string; href: string; badge: string | null; badgeClass: string }) {
    const isActive = item.href !== "__void__" && (
      item.href === "/vendor" ? pathname === "/vendor" : pathname.startsWith(item.href)
    );
    const isVoid = item.href === "__void__";

    if (isVoid) {
      return (
        <div
          key={item.label}
          className={`nav-item`}
          onClick={() => showToast(`${item.label} — coming soon`)}
          style={{ cursor: "pointer" }}
        >
          <span className="ni">{item.icon}</span> {item.label}
          {item.badge && <span className={`nbadge${item.badgeClass ? " " + item.badgeClass : ""}`}>{item.badge}</span>}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        className={`nav-item${isActive ? " active" : ""}`}
        style={{ textDecoration: "none" }}
      >
        <span className="ni">{item.icon}</span> {item.label}
        {item.badge && <span className={`nbadge${item.badgeClass ? " " + item.badgeClass : ""}`}>{item.badge}</span>}
      </Link>
    );
  }

  return (
    <>
      <div id="toast"></div>
      <div className="shell">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo-bar">
            <div className="logo">Bid<em>Master</em></div>
            <div className="logo-sub">Vendor Portal</div>
          </div>
          <div className="vendor-chip">
            <div className="va">AS</div>
            <div>
              <div className="vname">Acme Supply Co.</div>
              <div className="vco">Kitchen Vendor</div>
            </div>
          </div>
          <div className="sidebar-scroll">
            <div className="nav-lbl">Menu</div>
            {NAV_ITEMS.map(renderNavItem)}
            <div className="nav-lbl" style={{ marginTop: 8 }}>Results</div>
            {NAV_RESULTS.map(renderNavItem)}
            <div className="nav-lbl" style={{ marginTop: 8 }}>Account</div>
            {NAV_ACCOUNT.map(renderNavItem)}
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <div>
              <span className="page-title">{pageTitle}</span>
              <span className="page-sub">{pageSub}</span>
            </div>
            <div className="topbar-right">
              <div className="notif-btn" onClick={() => showToast("No new notifications")} style={{ cursor: "pointer" }}>
                \uD83D\uDD14<span className="notif-pip"></span>
              </div>
              <div
                className="fs-search"
                style={{ minWidth: 160 }}
              >
                <span style={{ color: "var(--faint)" }}>\uD83D\uDD0D</span>
                <input
                  placeholder="Search..."
                  onFocus={() => showToast("Search — coming soon")}
                  readOnly
                />
              </div>
            </div>
          </div>
          <div className="content">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
