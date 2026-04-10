import React from 'react';
import { useCaseHistory } from '../../api/hooks';
import {
  formatAuditPayload,
  getAuditActionLabel,
  getAuditDetailRows,
  getAuditEntityLabel,
} from './case-history-format';

export const CaseHistoryTab: React.FC<{ caseId: string }> = ({ caseId }) => {
  const { data: events, isLoading } = useCaseHistory(caseId);

  if (isLoading) {
    return <div style={{ padding: 32, color: '#6b7280' }}>Loading history...</div>;
  }

  if (!events?.length) {
    return <div style={{ padding: 32, color: '#6b7280' }}>No audit events recorded yet.</div>;
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Audit Trail</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {events.map((event, idx) => (
          <div
            key={event.id}
            style={{
              display: 'flex',
              gap: 16,
              padding: '12px 0',
              borderBottom: idx < events.length - 1 ? '1px solid #f3f4f6' : undefined,
            }}
          >
            {/* Timeline dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 20 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: event.action === 'create' ? '#2563eb' : '#9ca3af',
                  marginTop: 4,
                }}
              />
              {idx < events.length - 1 && <div style={{ width: 1, flex: 1, background: '#e5e7eb', marginTop: 4 }} />}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14 }}>
                <strong>{event.performedBy.name}</strong>{' '}
                <span style={{ color: '#6b7280' }}>{getAuditActionLabel(event.action)}</span>{' '}
                <span style={{ color: '#6b7280' }}>{getAuditEntityLabel(event.entityType)}</span>
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                {new Date(event.performedAt).toLocaleString()}
              </div>
              {getAuditDetailRows(event).length > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    display: 'grid',
                    gap: 8,
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {getAuditDetailRows(event).map((row) => (
                    <div
                      key={`${event.id}-${row.label}-${row.before ?? ''}-${row.after ?? ''}`}
                      style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, alignItems: 'start' }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {row.label}
                      </div>
                      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                        {row.before && row.before !== '—' ? `${row.before} -> ${row.after ?? '—'}` : (row.after ?? '—')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {event.reason && (
                <div style={{ fontSize: 13, color: '#374151', marginTop: 4, fontStyle: 'italic' }}>{event.reason}</div>
              )}
              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12, color: '#64748b' }}>Raw audit payload</summary>
                <pre
                  style={{
                    marginTop: 8,
                    padding: 12,
                    fontSize: 12,
                    lineHeight: 1.5,
                    background: '#0f172a',
                    color: '#e2e8f0',
                    borderRadius: 8,
                    overflowX: 'auto',
                    maxHeight: 240,
                  }}
                >
                  {formatAuditPayload(event)}
                </pre>
              </details>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
