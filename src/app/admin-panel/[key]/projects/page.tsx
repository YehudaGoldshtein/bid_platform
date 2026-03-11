'use client';

import { useEffect, useState } from 'react';

interface Project {
  id: string;
  name: string;
  address: string;
  type: string;
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

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch('/api/admin/projects')
      .then(r => r.json())
      .then(d => { setProjects(d.projects); setTotal(d.total); });
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Projects ({total})</h1>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Address</th>
            <th style={thStyle}>Created</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(p => (
            <tr key={p.id}>
              <td style={tdStyle}>{p.name}</td>
              <td style={tdStyle}>{p.type || '-'}</td>
              <td style={tdStyle}>
                <span style={{
                  padding: '2px 8px', borderRadius: 12, fontSize: 12,
                  background: p.status === 'active' ? '#d4edda' : '#e2e3e5',
                  color: p.status === 'active' ? '#155724' : '#383d41',
                }}>{p.status}</span>
              </td>
              <td style={tdStyle}>{p.address || '-'}</td>
              <td style={tdStyle}>{new Date(p.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr><td style={tdStyle} colSpan={5}>No projects yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
