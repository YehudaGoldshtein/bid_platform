'use client';

import { useEffect, useState } from 'react';

interface Invitation {
  id: string;
  vendor_name: string;
  vendor_email: string;
  bid_title: string;
  status: string;
  sent_at: string;
  opened_at: string | null;
  submitted_at: string | null;
}

const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse', background: '#fff',
  borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};
const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #eee',
  fontSize: 13, color: '#666', background: '#fafafa',
};
const tdStyle: React.CSSProperties = {
  padding: '10px 16px', borderBottom: '1px solid #f0f0f0', fontSize: 14,
};

const statusColors: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#e2e3e5', fg: '#383d41' },
  opened: { bg: '#fff3cd', fg: '#856404' },
  submitted: { bg: '#d4edda', fg: '#155724' },
  expired: { bg: '#f8d7da', fg: '#721c24' },
};

export default function AdminInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const params = filter ? `?status=${filter}` : '';
    fetch(`/api/admin/invitations${params}`)
      .then(r => r.json())
      .then(d => { setInvitations(d.invitations); setTotal(d.total); });
  }, [filter]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>Invitations ({total})</h1>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="opened">Opened</option>
          <option value="submitted">Submitted</option>
          <option value="expired">Expired</option>
        </select>
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Vendor</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Bid</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Sent</th>
            <th style={thStyle}>Opened</th>
            <th style={thStyle}>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map(inv => {
            const sc = statusColors[inv.status] || statusColors.pending;
            return (
              <tr key={inv.id}>
                <td style={tdStyle}>{inv.vendor_name}</td>
                <td style={tdStyle}>{inv.vendor_email}</td>
                <td style={tdStyle}>{inv.bid_title}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 12, fontSize: 12,
                    background: sc.bg, color: sc.fg,
                  }}>{inv.status}</span>
                </td>
                <td style={tdStyle}>{new Date(inv.sent_at).toLocaleDateString()}</td>
                <td style={tdStyle}>{inv.opened_at ? new Date(inv.opened_at).toLocaleDateString() : '-'}</td>
                <td style={tdStyle}>{inv.submitted_at ? new Date(inv.submitted_at).toLocaleDateString() : '-'}</td>
              </tr>
            );
          })}
          {invitations.length === 0 && (
            <tr><td style={tdStyle} colSpan={7}>No invitations found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
