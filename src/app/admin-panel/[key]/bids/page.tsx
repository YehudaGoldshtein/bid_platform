'use client';

import { useEffect, useState } from 'react';

interface Bid {
  id: string;
  title: string;
  status: string;
  deadline: string;
  project_name: string | null;
  created_at: string;
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
  draft: { bg: '#e2e3e5', fg: '#383d41' },
  active: { bg: '#d4edda', fg: '#155724' },
  awarded: { bg: '#cce5ff', fg: '#004085' },
  closed: { bg: '#f8d7da', fg: '#721c24' },
};

export default function AdminBids() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const params = filter ? `?status=${filter}` : '';
    fetch(`/api/admin/bids${params}`)
      .then(r => r.json())
      .then(d => { setBids(d.bids); setTotal(d.total); });
  }, [filter]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>Bids ({total})</h1>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="awarded">Awarded</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Title</th>
            <th style={thStyle}>Project</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Deadline</th>
            <th style={thStyle}>Created</th>
          </tr>
        </thead>
        <tbody>
          {bids.map(b => {
            const sc = statusColors[b.status] || statusColors.draft;
            return (
              <tr key={b.id}>
                <td style={tdStyle}>{b.title}</td>
                <td style={tdStyle}>{b.project_name || '-'}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 12, fontSize: 12,
                    background: sc.bg, color: sc.fg,
                  }}>{b.status}</span>
                </td>
                <td style={tdStyle}>{new Date(b.deadline).toLocaleDateString()}</td>
                <td style={tdStyle}>{new Date(b.created_at).toLocaleDateString()}</td>
              </tr>
            );
          })}
          {bids.length === 0 && (
            <tr><td style={tdStyle} colSpan={5}>No bids found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
