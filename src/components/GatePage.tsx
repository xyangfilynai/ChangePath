import React, { useState } from 'react';
import { Icon } from './Icon';

interface GatePageProps {
  onEnter: () => void;
}

export const GatePage: React.FC<GatePageProps> = ({ onEnter }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Please enter your invite code.');
      return;
    }
    if (trimmed.length < 3) {
      setError("That doesn\u2019t look like a valid invite code.");
      return;
    }
    onEnter();
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--color-bg)',
      padding: 'var(--space-xl)',
    }}>
      <div style={{
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-primary-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-lg)',
        }}>
          <Icon name="shield" size={28} color="var(--color-primary)" />
        </div>

        <h1 style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--color-text)',
          margin: '0 0 var(--space-sm)',
        }}>
          RegAssess AI/ML
        </h1>
        <p style={{
          fontSize: 14,
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 var(--space-xl)',
        }}>
          Regulatory change assessment prototype for AI/ML medical devices.
          You've been invited to review RegAssess and share your expert perspective.
        </p>

        <div style={{
          display: 'flex',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-sm)',
        }}>
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. RA-7K2M"
            style={{
              flex: 1,
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
              fontSize: 14,
              outline: 'none',
              background: 'var(--color-bg-card)',
            }}
          />
          <button
            onClick={handleSubmit}
            style={{
              padding: 'var(--space-md) var(--space-lg)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Enter
          </button>
        </div>

        {error && (
          <p style={{
            fontSize: 13,
            color: 'var(--color-danger)',
            margin: '0 0 var(--space-sm)',
          }}>
            {error}
          </p>
        )}

        <p style={{
          fontSize: 12,
          color: 'var(--color-text-muted)',
          margin: 0,
        }}>
          Check your invitation email for this code.
        </p>
      </div>
    </div>
  );
};
