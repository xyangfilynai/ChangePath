import React from 'react';
import { Icon } from './Icon';

interface DashboardPageProps {
  onQuickReview: () => void;
  onFullAssessment: () => void;
  onResume: () => void;
  hasSavedSession: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onQuickReview,
  onFullAssessment,
  onResume,
  hasSavedSession,
}) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
    }}>
      {/* Header bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--space-lg)',
        height: 64,
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-elevated)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <img src="/logo.png" alt="RegAssess Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>RegAssess</span>
          <span style={{
            fontSize: 11, fontWeight: 500, padding: '2px 6px',
            borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-muted)',
            color: 'var(--color-primary)', marginLeft: 4,
          }}>AI/ML</span>
        </div>
      </header>

      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: 'var(--space-xl)',
      }}>
        {/* Hero */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <span style={{
            fontSize: 12, fontWeight: 600, color: 'var(--color-success)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Regulatory Assessment Tool
          </span>
          <h1 style={{
            fontSize: 28, fontWeight: 700, color: 'var(--color-text)',
            margin: 'var(--space-sm) 0',
          }}>
            AI/ML Device Change Assessment
          </h1>
          <p style={{
            fontSize: 15, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0,
          }}>
            U.S.-primary regulatory pathway determination for AI/ML device changes,
            with escalation cues for EU, UK, Canada, Japan, and China.
          </p>
        </div>

        {/* Action cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Quick Expert Review */}
          <button
            onClick={onQuickReview}
            data-testid="quick-review-btn"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-lg)',
              padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)',
              background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
              textAlign: 'left', cursor: 'pointer', transition: 'all var(--transition-fast)',
              position: 'relative',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="check" size={20} color="var(--color-success)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>
                  Quick Expert Review
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)', background: 'var(--color-success)',
                  color: '#fff', textTransform: 'uppercase',
                }}>Recommended</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 var(--space-sm)', lineHeight: 1.5 }}>
                Pre-loaded synthetic case &mdash; review pre-filled answers, adjust what you'd answer differently, then see the determination.
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                Case: New clinical sites with different scanners and demographics &mdash; no PCCP yet. Does the assessment recommend establishing one?
              </p>
            </div>
          </button>

          {/* Full Assessment */}
          <button
            onClick={onFullAssessment}
            data-testid="full-assessment-btn"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-lg)',
              padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)',
              background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
              textAlign: 'left', cursor: 'pointer', transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'var(--color-primary-muted)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="plus" size={20} color="var(--color-primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 4 }}>
                Full Assessment &mdash; Your Own Scenario
              </span>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Run the complete assessment workflow with your own device and change details.
                U.S.-primary regulatory change assessment with non-U.S. escalation cues. Typically 10&ndash;25 minutes.
              </p>
            </div>
          </button>

          {/* Resume (conditional) */}
          {hasSavedSession && (
            <button
              onClick={onResume}
              data-testid="resume-btn"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-lg)',
                padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)',
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                textAlign: 'left', cursor: 'pointer', transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="clock" size={20} color="var(--color-success)" />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 4 }}>
                  Resume In-Progress Assessment
                </span>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Continue where you left off.
                </p>
              </div>
            </button>
          )}
        </div>

        {/* How It Works */}
        <div style={{ marginTop: 'var(--space-xl)' }}>
          <h2 style={{
            fontSize: 16, fontWeight: 600, color: 'var(--color-text)',
            marginBottom: 'var(--space-md)',
          }}>
            How It Works
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--space-md)',
          }}>
            {[
              { step: '1', title: 'Device Profile', desc: 'Authorization pathway, PCCP status, markets, safety class, and AI/ML technology type.' },
              { step: '2', title: 'Classify & Assess', desc: 'Change classification, intended use impact, regulatory significance, PCCP scope, GenAI checks, and equity.' },
              { step: '3', title: 'Non-U.S. Follow-Up', desc: 'Escalation cues for EU, UK, Canada, Japan, and China. Not a full multi-market determination.' },
              { step: '4', title: 'Determination', desc: 'Regulatory pathway, confidence level, decision trace, and documentation checklist.' },
            ].map(s => (
              <div key={s.step} style={{
                padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', fontSize: 12, fontWeight: 700,
                  background: 'var(--color-primary-muted)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 'var(--space-sm)',
                }}>{s.step}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <p style={{
          fontSize: 11, color: 'var(--color-text-muted)', marginTop: 'var(--space-lg)',
          textAlign: 'center',
        }}>
          Synthetic example for review only &mdash; not based on a specific marketed device.
        </p>
      </div>
    </div>
  );
};
