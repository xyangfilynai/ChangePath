import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useLogin } from '../api/hooks';
import { hasStoredSession } from '../api/client';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();

  const [email, setEmail] = useState('alice@acmemedtech.com');
  const [password, setPassword] = useState('changepath-demo');

  if (hasStoredSession()) {
    return <Navigate to="/" replace />;
  }

  const redirectTo = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      navigate(redirectTo?.pathname ? `${redirectTo.pathname}${redirectTo.search ?? ''}` : '/', { replace: true });
    } catch {
      // surfaced below
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
        }}
      >
        <p style={{ margin: 0, fontSize: 12, letterSpacing: 1.2, color: '#2563eb', fontWeight: 700 }}>
          CHANGEPATH ENTERPRISE
        </p>
        <h1 style={{ margin: '8px 0 6px', fontSize: 28 }}>Sign in</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
          Local development auth for the Phase 1 enterprise foundation.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: 24, display: 'grid', gap: 16 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
            />
          </label>

          {login.error && (
            <div
              style={{
                background: '#fef2f2',
                color: '#b91c1c',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
              }}
            >
              {login.error.message}
            </div>
          )}

          <button type="submit" className="btn-continue" disabled={login.isPending}>
            {login.isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div
          style={{
            marginTop: 20,
            padding: 12,
            background: '#f8fafc',
            borderRadius: 10,
            fontSize: 13,
            color: '#475569',
          }}
        >
          Seeded demo accounts:
          <div style={{ marginTop: 6 }}>`alice@acmemedtech.com` or `bob@acmemedtech.com`</div>
          <div style={{ marginTop: 4 }}>Shared dev password: `changepath-demo`</div>
        </div>
      </div>
    </div>
  );
};
