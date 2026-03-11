'use client';

import { useEffect, useState } from 'react';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  trade_name: string | null;
  status: string;
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

export default function AdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const params = filter ? `?status=${filter}` : '';
    fetch(`/api/admin/vendors${params}`)
      .then(r => r.json())
      .then(d => { setVendors(d.vendors); setTotal(d.total); });
  }, [filter]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>Vendors ({total})</h1>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="removed">Removed</option>
        </select>
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Phone</th>
            <th style={thStyle}>Trade</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Created</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map(v => (
            <tr key={v.id}>
              <td style={tdStyle}>{v.name}</td>
              <td style={tdStyle}>{v.email}</td>
              <td style={tdStyle}>{v.phone || '-'}</td>
              <td style={tdStyle}>{v.trade_name || '-'}</td>
              <td style={tdStyle}>
                <span style={{
                  padding: '2px 8px', borderRadius: 12, fontSize: 12,
                  background: v.status === 'active' ? '#d4edda' : v.status === 'suspended' ? '#fff3cd' : '#f8d7da',
                  color: v.status === 'active' ? '#155724' : v.status === 'suspended' ? '#856404' : '#721c24',
                }}>{v.status}</span>
              </td>
              <td style={tdStyle}>{new Date(v.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {vendors.length === 0 && (
            <tr><td style={tdStyle} colSpan={6}>No vendors found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
