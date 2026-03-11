'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const key = params.key as string;
  const base = `/admin-panel/${key}`;
  const [authSet, setAuthSet] = useState(false);

  // Set admin-auth cookie on first load so API calls work
  useEffect(() => {
    if (!authSet) {
      fetch(`/api/admin/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      }).then(() => setAuthSet(true)).catch(() => {});
    }
  }, [key, authSet]);

  const nav = [
    { href: base, label: 'Dashboard', icon: '📊' },
    { href: `${base}/projects`, label: 'Projects', icon: '🏗' },
    { href: `${base}/bids`, label: 'Bids', icon: '📋' },
    { href: `${base}/vendors`, label: 'Vendors', icon: '👷' },
    { href: `${base}/invitations`, label: 'Invitations', icon: '✉' },
  ];

  function isActive(href: string) {
    if (href === base) return pathname === base || pathname === base + '/';
    return pathname.startsWith(href);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{
        width: 220,
        background: '#1a1a2e',
        color: '#fff',
        padding: '20px 0',
        flexShrink: 0,
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #333', marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>BidMaster Admin</h2>
          <span style={{ fontSize: 12, color: '#888' }}>Control Panel</span>
        </div>
        <nav>
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '10px 20px',
                color: isActive(item.href) ? '#fff' : '#aaa',
                background: isActive(item.href) ? '#16213e' : 'transparent',
                textDecoration: 'none',
                fontSize: 14,
                borderLeft: isActive(item.href) ? '3px solid #4361ee' : '3px solid transparent',
              }}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, background: '#f5f5f5', padding: 24 }}>
        {children}
      </main>
    </div>
  );
}
