import React, { useState } from 'react';
import { Icon } from './Icon';
import type { SavedAssessment } from '../lib/assessment-store';

/** Creates onMouseEnter/onMouseLeave handlers for border-color + boxShadow hover effects. */
const hoverHandlers = (hoverBorder: string, restBorder: string) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = hoverBorder;
    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = restBorder;
    e.currentTarget.style.boxShadow = 'none';
  },
});

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
      background: '#f9fafb',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: 72,
        borderBottom: '1px solid #e5e7eb',
        background: '#ffffff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="RegAccess" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={{ fontSize: 17, fontWeight: 600, color: '#111827', letterSpacing: '-0.01em' }}>
            RegAccess
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 4,
            background: '#f0fdf4',
            color: '#15803d',
            letterSpacing: '0.02em',
          }}>
            AI/ML
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          RegAccess Workspace
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: 880,
        margin: '0 auto',
        padding: '56px 40px 80px',
      }}>
        {/* Page Header */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 600,
            color: '#111827',
            margin: '0 0 12px',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            AI/ML device change assessment
          </h1>
          <p style={{
            fontSize: 15,
            color: '#6b7280',
            margin: 0,
            lineHeight: 1.6,
            maxWidth: 700,
          }}>
            FDA-primary pathway framing for regulatory, ML, quality, and clinical reviewers. Capture the authorized baseline, classify the change, trace pathway logic, and document an internal record for qualified expert review.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 36,
        }}>
          {[
            {
              title: 'FDA-primary',
              desc: 'U.S. regulatory pathways first, with pointers to EU, UK, Canada, Japan, and China where relevant.',
              icon: 'shield',
              accent: '#0891b2',
              bg: '#ecfeff',
              border: '#a5f3fc',
            },
            {
              title: 'Expert review',
              desc: 'Surface open items, evidence gaps, reviewer notes, and review status before relying on outputs.',
              icon: 'users',
              accent: '#0f766e',
              bg: '#ecfdf5',
              border: '#a7f3d0',
            },
            {
              title: 'Traceability',
              desc: 'Keep pathway basis, documentation cues, and review context in one assessment record.',
              icon: 'fileText',
              accent: '#475569',
              bg: '#f8fafc',
              border: '#cbd5e1',
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                padding: '16px 18px',
                borderRadius: 10,
                background: item.bg,
                border: `1px solid ${item.border}`,
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}>
                <Icon name={item.icon} size={15} color={item.accent} />
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: item.accent,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}>
                  {item.title}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.55, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {hasSavedWork && (
          <section style={{ marginBottom: 56 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}>
              <h2 style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#9ca3af',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                Resume or open
              </h2>
              <div style={{
                height: 1,
                flex: 1,
                background: '#e5e7eb',
                marginLeft: 20,
              }} />
            </div>

            {hasSavedSession && (
              <button
                onClick={onResume}
                data-testid="resume-btn"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  width: '100%',
                  padding: '18px 22px',
                  borderRadius: 10,
                  background: '#fefce8',
                  border: '1px solid #fef08a',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                  marginBottom: savedAssessments.length > 0 ? 12 : 0,
                }}
                {...hoverHandlers('#fde047', '#fef08a')}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon name="clock" size={18} color="#ca8a04" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#854d0e', marginBottom: 4 }}>
                    Resume this browser session
                  </div>
                  <p style={{ fontSize: 13, color: '#a16207', lineHeight: 1.55, margin: 0 }}>
                    Continue the in-progress assessment stored locally in this browser (not a named saved case).
                  </p>
                </div>
                <Icon name="arrow" size={16} color="#ca8a04" style={{ marginTop: 4 }} />
              </button>
            )}

            {savedAssessments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {savedAssessments.map(assessment => {
                const isConfirmingDelete = confirmDeleteId === assessment.id;

                return (
                  <div
                    key={assessment.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px 20px',
                      borderRadius: 8,
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ marginBottom: 4 }}>
                        <span style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {assessment.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#9ca3af' }}>
                        {assessment.lastPathway && (
                          <span>{assessment.lastPathway}</span>
                        )}
                        <span>Updated {new Date(assessment.updatedAt).toLocaleDateString()}</span>
                        {assessment.versions.length > 0 && (
                          <span>v{assessment.versions.length + 1}</span>
                        )}
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
                            padding: '6px 14px',
                            borderRadius: 6,
                            background: '#111827',
                            border: 'none',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
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
                            borderRadius: 6,
                            background: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            color: '#6b7280',
                            fontSize: 12,
                            cursor: 'pointer',
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
                                borderRadius: 6,
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                background: '#f3f4f6',
                                border: '1px solid #e5e7eb',
                                color: '#6b7280',
                                fontSize: 12,
                                cursor: 'pointer',
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
                              borderRadius: 6,
                              background: '#f3f4f6',
                              border: '1px solid #e5e7eb',
                              color: '#9ca3af',
                              fontSize: 12,
                              cursor: 'pointer',
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

        <section style={{ marginBottom: 56 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}>
            <h2 style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#9ca3af',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              New assessment
            </h2>
            <div style={{
              height: 1,
              flex: 1,
              background: '#e5e7eb',
              marginLeft: 20,
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button
              onClick={onFullAssessment}
              data-testid="full-assessment-btn"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 20,
                padding: '24px 28px',
                borderRadius: 10,
                background: '#ffffff',
                border: '1px solid #a5f3fc',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                boxShadow: '0 1px 2px rgba(8, 145, 178, 0.06)',
              }}
              {...hoverHandlers('#67e8f9', '#a5f3fc')}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#ecfeff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name="fileText" size={20} color="#0891b2" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#111827',
                  }}>
                    Full Assessment
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: '#ecfeff',
                    color: '#0891b2',
                    border: '1px solid #a5f3fc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    Default path
                  </span>
                </div>
                <p style={{
                  fontSize: 14,
                  color: '#475569',
                  margin: 0,
                  lineHeight: 1.55,
                }}>
                  Start a blank case from the authorized baseline through regulatory significance, optional PCCP scope, GenAI checks, population impact, and final review.
                </p>
              </div>
              <Icon name="arrow" size={18} color="#0891b2" style={{ marginTop: 4 }} />
            </button>

            <button
              onClick={onQuickReview}
              data-testid="quick-review-btn"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 20,
                padding: '22px 28px',
                borderRadius: 10,
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              {...hoverHandlers('#d1d5db', '#e5e7eb')}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name="zap" size={20} color="#475569" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#111827',
                  }}>
                    Sample workflow
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: '#f8fafc',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    Example data
                  </span>
                </div>
                <p style={{
                  fontSize: 14,
                  color: '#6b7280',
                  margin: 0,
                  lineHeight: 1.55,
                }}>
                  Load worked example answers to review navigation, rationale, and the final review screen before entering a live case.
                </p>
                <p style={{
                  fontSize: 12,
                  color: '#9ca3af',
                  margin: '10px 0 0',
                  lineHeight: 1.5,
                  paddingTop: 10,
                  borderTop: '1px solid #f3f4f6',
                }}>
                  Example scenario: new clinical sites and scanners, demographic shift, uncertain subgroup performance, no authorized PCCP.
                </p>
              </div>
              <Icon name="arrow" size={18} color="#9ca3af" style={{ marginTop: 4 }} />
            </button>
          </div>
        </section>

        {/* Footer Note */}
        <div style={{
          marginTop: 48,
          padding: '16px 20px',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
        }}>
          <p style={{
            fontSize: 12,
            color: '#6b7280',
            margin: 0,
            lineHeight: 1.6,
          }}>
            <strong style={{ color: '#374151', fontWeight: 600 }}>Decision support only — not a regulatory determination.</strong>{' '}
            RegAccess supports internal change-control planning and submission strategy discussion.
            It does not replace qualified regulatory or legal judgment or agency decisions.
            Review all outputs with appropriate regulatory and clinical expertise before action.
          </p>
        </div>
      </main>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          main {
            padding: 32px 20px 60px !important;
          }
          header {
            padding: 0 20px !important;
          }
          [style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          [style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
