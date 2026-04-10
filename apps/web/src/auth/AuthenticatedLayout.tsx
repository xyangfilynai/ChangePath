import React, { useEffect } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMe, useLogout } from '../api/hooks';
import { clearStoredSession, hasStoredSession } from '../api/client';

export const AuthenticatedLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();
  const hasSession = hasStoredSession();
  const { data: session, isLoading, error } = useMe();
  const errorStatus =
    error && typeof error === 'object' && 'status' in error ? (error as { status?: number }).status : undefined;

  useEffect(() => {
    if (errorStatus === 401) {
      clearStoredSession();
      navigate('/login', {
        replace: true,
        state: { from: { pathname: location.pathname, search: location.search } },
      });
    }
  }, [errorStatus, location.pathname, location.search, navigate]);

  if (!hasSession) {
    return <Navigate to="/login" replace state={{ from: { pathname: location.pathname, search: location.search } }} />;
  }

  if (isLoading) {
    return <div style={{ padding: 32, color: '#6b7280' }}>Loading session...</div>;
  }

  if (error || !session) {
    return null;
  }

  return (
    <div>
      <header
        style={{
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 700 }}>
              ChangePath
            </Link>
            <nav style={{ display: 'flex', gap: 14, fontSize: 14 }}>
              <Link to="/" style={{ color: '#475569', textDecoration: 'none' }}>
                Cases
              </Link>
              <Link to="/cases/new" style={{ color: '#475569', textDecoration: 'none' }}>
                New Case
              </Link>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{session.user.name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{session.organization.name}</div>
            </div>
            <button
              className="btn-outline"
              onClick={async () => {
                try {
                  await logout.mutateAsync();
                } finally {
                  navigate('/login', { replace: true });
                }
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
};
