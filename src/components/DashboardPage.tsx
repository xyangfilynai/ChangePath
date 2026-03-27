import React, { useState } from 'react';
import { Icon } from './Icon';
import type { SavedAssessment } from '../lib/assessment-store';

interface DashboardPageProps {
  onQuickReview: () => void;
  onFullAssessment: () => void;
  onResume: () => void;
  hasSavedSession: boolean;
  savedAssessments?: SavedAssessment[];
  onLoadAssessment?: (id: string) => void;
  onDuplicateAssessment?: (id: string) => void;
  onDeleteAssessment?: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onQuickReview,
  onFullAssessment,
  onResume,
  hasSavedSession,
  savedAssessments = [],
  onLoadAssessment,
  onDuplicateAssessment,
  onDeleteAssessment,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const hasSavedWork = hasSavedSession || savedAssessments.length > 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafbfc',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: 64,
        borderBottom: '1px solid #e2e8f0',
        background: '#ffffff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="RegAssess" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.01em' }}>
            RegAssess
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: 840,
        margin: '0 auto',
        padding: '64px 40px 80px',
      }}>
        {/* Hero Section */}
        <div style={{ marginBottom: 72 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 16,
          }}>
            RegAssess
          </div>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 20px',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
          }}>
            Assess regulatory pathway for AI-related medical device changes
          </h1>
          <p style={{
            fontSize: 15,
            color: '#475569',
            lineHeight: 1.65,
            maxWidth: 720,
            margin: 0,
          }}>
            An early prototype for structured assessment of AI-related medical device changes. Review the authorized baseline, work through change classification and significance, and document a proposed pathway with supporting rationale and open issues.
          </p>
          <div style={{
            display: 'inline-block',
            marginTop: 20,
            padding: '6px 12px',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            Prototype — decision support only
          </div>
        </div>

        {/* Primary Actions Section */}
        <section style={{ marginBottom: 72 }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#64748b',
            margin: '0 0 24px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Choose how to begin
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Resume Assessment Card */}
            {hasSavedSession && (
              <button
                onClick={onResume}
                data-testid="resume-btn"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  width: '100%',
                  padding: '20px 24px',
                  borderRadius: 8,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#94a3b8';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon name="clock" size={18} color="#64748b" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                    Resume current assessment
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                    Continue the in-progress assessment stored in this browser.
                  </p>
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#64748b',
                  marginTop: 4,
                  flexShrink: 0,
                }}>
                  In progress
                </div>
              </button>
            )}

            {/* Start Full Assessment Card */}
            <button
              onClick={onFullAssessment}
              data-testid="full-assessment-btn"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                width: '100%',
                padding: '20px 24px',
                borderRadius: 8,
                background: '#ffffff',
                border: '2px solid #cbd5e1',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name="fileText" size={18} color="#64748b" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                  Start full assessment
                </div>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                  Begin a new assessment from device profile through change classification, significance review, pathway assessment, and final review.
                </p>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                color: '#64748b',
                marginTop: 4,
                flexShrink: 0,
              }}>
                Full flow
              </div>
            </button>

            {/* Explore Sample Workflow Card */}
            <button
              onClick={onQuickReview}
              data-testid="quick-review-btn"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                width: '100%',
                padding: '20px 24px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name="zap" size={18} color="#64748b" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                  Explore sample workflow
                </div>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                  Open an example assessment to review the flow, outputs, and final review structure before using the prototype on a live case.
                </p>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                color: '#64748b',
                marginTop: 4,
                flexShrink: 0,
              }}>
                Example
              </div>
            </button>
          </div>
        </section>

        {/* Workflow Preview Section */}
        <section style={{ marginBottom: 72 }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#64748b',
            margin: '0 0 24px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Workflow overview
          </h2>

          <div style={{
            padding: 24,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
          }}>
            <ol style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 16,
              margin: 0,
              paddingLeft: 0,
              listStylePosition: 'inside',
            }}>
              {[
                'Device profile',
                'Change classification',
                'Regulatory significance',
                'PCCP scope, when relevant',
                'GenAI checks, when relevant',
                'Population impact',
                'Final review',
              ].map((step, index) => (
                <li key={step} style={{
                  fontSize: 13,
                  color: '#0f172a',
                  lineHeight: 1.5,
                  listStyleType: 'decimal',
                }}>
                  {step}
                </li>
              ))}
            </ol>

            <p style={{
              fontSize: 13,
              color: '#64748b',
              lineHeight: 1.65,
              margin: '20px 0 0',
              paddingTop: 20,
              borderTop: '1px solid #cbd5e1',
            }}>
              The final review may include a proposed pathway, rationale, assessment basis, open issues or evidence gaps, and supporting source documents.
            </p>
          </div>
        </section>

        {/* Saved Assessments Section */}
        {hasSavedWork && (
          <section style={{ marginBottom: 72 }}>
            <h2 style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#64748b',
              margin: '0 0 24px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Saved assessments
            </h2>

            {savedAssessments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {savedAssessments.map(assessment => {
                  const isConfirmingDelete = confirmDeleteId === assessment.id;

                  return (
                    <div
                      key={assessment.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '14px 16px',
                        borderRadius: 6,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ marginBottom: 4 }}>
                          <span style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#0f172a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {assessment.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#64748b' }}>
                          {assessment.lastPathway && (
                            <span>{assessment.lastPathway}</span>
                          )}
                          <span>Updated {new Date(assessment.updatedAt).toLocaleDateString()}</span>
                          {assessment.reviewerNotes.length > 0 && (
                            <span>{assessment.reviewerNotes.length} note{assessment.reviewerNotes.length !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {onLoadAssessment && (
                          <button
                            onClick={() => onLoadAssessment(assessment.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 4,
                              background: '#0f172a',
                              border: 'none',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#1e293b'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#0f172a'}
                          >
                            Open
                          </button>
                        )}
                        {onDuplicateAssessment && (
                          <button
                            onClick={() => onDuplicateAssessment(assessment.id)}
                            title="Duplicate"
                            style={{
                              padding: '6px 10px',
                              borderRadius: 4,
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              color: '#64748b',
                              fontSize: 11,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            Duplicate
                          </button>
                        )}
                        {onDeleteAssessment && (
                          isConfirmingDelete ? (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                onClick={() => {
                                  onDeleteAssessment(assessment.id);
                                  setConfirmDeleteId(null);
                                }}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: 4,
                                  background: '#fee2e2',
                                  border: '1px solid #fca5a5',
                                  color: '#dc2626',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: 4,
                                  background: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  color: '#64748b',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(assessment.id)}
                              title="Delete"
                              style={{
                                padding: '6px 10px',
                                borderRadius: 4,
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                color: '#94a3b8',
                                fontSize: 11,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              Delete
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Disclaimer Section */}
        <section>
          <h2 style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#64748b',
            margin: '0 0 24px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Prototype use and limitations
          </h2>

          <div style={{
            padding: 24,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
          }}>
            <p style={{
              fontSize: 13,
              color: '#475569',
              lineHeight: 1.65,
              margin: 0,
            }}>
              RegAssess is an early prototype intended to support structured internal assessment. It does not provide a regulatory determination and does not replace qualified regulatory, legal, clinical, quality, or engineering judgment. Outputs should be reviewed before reliance or action.
            </p>
          </div>
        </section>
      </main>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          main {
            padding: 48px 24px 60px !important;
          }
          header {
            padding: 0 24px !important;
          }
        }
        @media (max-width: 480px) {
          main {
            padding: 40px 16px 60px !important;
          }
          header {
            padding: 0 16px !important;
          }
          h1 {
            font-size: 24px !important;
          }
        }
      `}</style>
    </div>
  );
};
