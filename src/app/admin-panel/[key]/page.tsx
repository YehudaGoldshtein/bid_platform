'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalProjects: number;
  activeProjects: number;
  totalBids: number;
  activeBids: number;
  awardedBids: number;
  totalVendors: number;
  totalInvitations: number;
  submittedInvitations: number;
  responseRate: number;
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  padding: '20px 24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  minWidth: 180,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(setStats)
      .catch(() => setError('Failed to load stats'));
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!stats) return <p>Loading...</p>;

  const kpis = [
    { label: 'Total Projects', value: stats.totalProjects, color: '#4361ee' },
    { label: 'Active Projects', value: stats.activeProjects, color: '#3a86ff' },
    { label: 'Total Bids', value: stats.totalBids, color: '#8338ec' },
    { label: 'Active Bids', value: stats.activeBids, color: '#ff006e' },
    { label: 'Awarded Bids', value: stats.awardedBids, color: '#06d6a0' },
    { label: 'Vendors', value: stats.totalVendors, color: '#fb5607' },
    { label: 'Invitations', value: stats.totalInvitations, color: '#ffbe0b' },
    { label: 'Response Rate', value: `${stats.responseRate}%`, color: '#06d6a0' },
  ];

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {kpis.map(kpi => (
          <div key={kpi.label} style={cardStyle}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
