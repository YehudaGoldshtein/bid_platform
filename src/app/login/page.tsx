'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Hardcoded admin credentials for now
    if (email === 'admin@bidmaster.com' && password === 'BidMaster2025!') {
      router.push('/portal');
      return;
    }

    setError('Invalid email or password');
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      color: '#fff',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        padding: '0 24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '1.8rem',
              letterSpacing: '-0.02em',
              color: '#fff',
              marginBottom: 8,
            }}>
              Bid<span style={{ color: '#f5a623' }}>Master</span>
            </div>
          </Link>
          <p style={{ color: '#8a8fa8', fontSize: '0.95rem' }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: '#1c1f2e',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '40px 36px',
        }}>
          {error && (
            <div style={{
              background: 'rgba(255,59,48,0.12)',
              border: '1px solid rgba(255,59,48,0.3)',
              color: '#ff6b6b',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.85rem',
              marginBottom: 20,
            }}>{error}</div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              color: '#8a8fa8',
              marginBottom: 8,
              fontWeight: 500,
            }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              color: '#8a8fa8',
              marginBottom: 8,
              fontWeight: 500,
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: '#f5a623',
              color: '#0a0a0f',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '1rem',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: '0.85rem',
          color: '#8a8fa8',
        }}>
          Don&apos;t have an account?{' '}
          <Link href="/#pricing" style={{ color: '#f5a623', textDecoration: 'none' }}>Start Free Trial</Link>
        </p>
      </div>
    </div>
  );
}
