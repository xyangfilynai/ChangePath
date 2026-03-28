import React, { useState, useMemo } from 'react';
import { Icon } from './Icon';
import { BrandMark } from './BrandMark';
import { AuthPathway, Answer, type Answers, type DeterminationResult } from '../lib/assessment-engine';
import { getSections, getHandoffTitle, getHandoffDesc, getPreparationPackageLabel } from '../lib/handoff-checklist';

// Re-export for test compatibility
export type { ChecklistSection } from '../lib/handoff-checklist';
export { getSections } from '../lib/handoff-checklist';

interface HandoffPageProps {
  determination: DeterminationResult;
  answers: Answers;
  onBack: () => void;
  onBackToAssessment: () => void;
}

export const HandoffPage: React.FC<HandoffPageProps> = ({ determination, answers, onBack, onBackToAssessment }) => {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [markedComplete, setMarkedComplete] = useState(false);

  const isDeNovo = answers.A1 === AuthPathway.DeNovo;
  const isPMA = answers.A1 === AuthPathway.PMA;
  const isNewSub = determination.isNewSub;
  const isIncomplete = determination.isIncomplete;
  const consistencyIssues = determination.consistencyIssues || [];

  const sections = useMemo(() => getSections(determination, answers), [determination, answers]);
  const title = getHandoffTitle(determination, answers);
  const desc = getHandoffDesc(determination, answers);
  const packageLabel = getPreparationPackageLabel(determination, answers);

  if (isIncomplete) {
    return (
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '48px 32px',
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: 24,
          }}
        >
          <Icon name="arrowLeft" size={14} /> Back to assessment record
        </button>
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            background: 'var(--color-bg-elevated)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
          }}
        >
          <Icon name="alertCircle" size={32} color="var(--color-warning)" />
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--color-text)',
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            Assessment incomplete
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            Pathway-critical fields are still open. Return to the assessment and complete them before using the
            preparation checklist.
          </p>
          <button
            onClick={onBackToAssessment}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 8,
              background: 'var(--color-primary)',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Return to Assessment
          </button>
        </div>
      </div>
    );
  }

  const allItemKeys = sections.flatMap((s, si) => s.items.map((_, ii) => `${si}-${ii}`));
  const totalItems = allItemKeys.length;
  const checkedCount = allItemKeys.filter((k) => checks[k]).length;
  const progressPercent = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const toggleCheck = (key: string) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-lg)',
          height: 64,
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-elevated)',
        }}
      >
        <BrandMark />
      </header>

      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '36px 32px 60px',
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: 24,
          }}
        >
          <Icon name="arrowLeft" size={14} /> Back to assessment record
        </button>

        {/* Title Card */}
        <div
          style={{
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            background: 'var(--color-bg-elevated)',
          }}
        >
          <div
            style={{
              padding: '28px 32px',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background:
                    determination.isPCCPImpl || determination.isLetterToFile || determination.isPMAAnnualReport
                      ? 'var(--color-success)'
                      : 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="fileText" size={20} color="#fff" />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--color-text-secondary)',
                    margin: '4px 0 0',
                    lineHeight: 1.5,
                  }}
                >
                  {desc}
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 10,
                marginBottom: 18,
              }}
            >
              {[
                { label: 'Assessed pathway', value: determination.pathway },
                { label: 'Primary package', value: packageLabel },
                { label: 'Change', value: (answers.B2 as string) || (answers.B1 as string) || 'Not specified' },
                { label: 'Authorized baseline', value: (answers.A1c as string) || 'Not specified' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.45 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  flex: 1,
                  background: 'var(--color-border)',
                  borderRadius: 4,
                  height: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: 'var(--color-success)',
                    borderRadius: 4,
                    height: 6,
                    width: `${progressPercent}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-success)',
                }}
              >
                {checkedCount}/{totalItems}
              </span>
            </div>
          </div>

          <div style={{ padding: '24px 32px' }}>
            {/* Advisory notes */}
            <div
              style={{
                padding: '12px 16px',
                marginBottom: 20,
                borderRadius: 8,
                background: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <Icon name="check" size={14} color="var(--color-success)" style={{ marginTop: 1 }} />
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.55,
                }}
              >
                <strong style={{ color: 'var(--color-success)' }}>Preparation checklist</strong> — Use this page as an
                execution-oriented checklist derived from the current assessed pathway. For regulatory source references
                and open-issue detail, return to the assessment record.
              </div>
            </div>

            {consistencyIssues.length > 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  marginBottom: 20,
                  borderRadius: 8,
                  background: 'var(--color-warning-bg)',
                  border: '1px solid var(--color-warning-border)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <Icon name="alertCircle" size={13} color="var(--color-warning)" style={{ marginTop: 1 }} />
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: 'var(--color-warning)' }}>Resolve flagged review items first.</strong> This
                  assessment still lists {consistencyIssues.length} review item
                  {consistencyIssues.length === 1 ? '' : 's'} that may affect package strategy or wording.
                </div>
              </div>
            )}

            {/* Assessment context */}
            <div
              style={{
                background: 'var(--color-bg-card)',
                borderRadius: 10,
                padding: '16px 20px',
                marginBottom: 24,
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  color: 'var(--color-text-muted)',
                  marginBottom: 8,
                }}
              >
                Assessment context
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
                  <strong>Authorization:</strong> {(answers.A1 as string) || 'Not specified'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
                  <strong>Authorization ID:</strong> {(answers.A1b as string) || 'Not specified'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
                  <strong>PCCP:</strong>{' '}
                  {answers.A2 === Answer.Yes
                    ? 'Authorized PCCP on file'
                    : answers.A2 === Answer.No
                      ? 'No authorized PCCP'
                      : 'Not specified'}
                </div>
              </div>
            </div>

            {/* Pre-Submission recommendation for new submissions */}
            {isNewSub && (
              <div
                style={{
                  marginBottom: 20,
                  padding: '16px 20px',
                  background: 'var(--color-info-bg)',
                  borderRadius: 10,
                  border: '1px solid var(--color-info-border)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <Icon name="alertCircle" size={15} color="var(--color-info)" style={{ marginTop: 1 }} />
                <div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-info)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Pre-Submission (Q-Sub) {isDeNovo ? 'Highly advisable' : 'Advisable'}
                  </span>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.6,
                    }}
                  >
                    {isDeNovo
                      ? 'FDA 510(k) software change guidance is often applied by analogy to De Novo-authorized devices; a Pre-Submission remains useful when device-type fit or pathway choice is uncertain.'
                      : `Consider a Pre-Submission with FDA before finalizing the ${isPMA ? 'PMA supplement' : '510(k)'} package when the case is borderline or novel.`}
                  </div>
                </div>
              </div>
            )}

            {/* Checklist sections */}
            <div style={{ display: 'grid', gap: 14 }}>
              {sections.map((section, si) => {
                const sectionKeys = section.items.map((_, ii) => `${si}-${ii}`);
                const allDone = sectionKeys.every((k) => checks[k]);
                const anyDone = sectionKeys.some((k) => checks[k]);
                const status = allDone ? 'complete' : anyDone ? 'in_progress' : 'not_started';

                return (
                  <div
                    key={si}
                    style={{
                      borderRadius: 10,
                      border: '1px solid var(--color-border)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--color-bg-elevated)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background:
                              status === 'complete'
                                ? 'var(--color-success)'
                                : status === 'in_progress'
                                  ? 'var(--color-warning)'
                                  : 'var(--color-bg-card)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            color: status === 'not_started' ? 'var(--color-text-muted)' : '#fff',
                            border: status === 'not_started' ? '1px solid var(--color-border)' : 'none',
                          }}
                        >
                          {status === 'complete' ? <Icon name="check" size={14} color="#fff" /> : section.n}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: 'var(--color-text)',
                            }}
                          >
                            {section.title}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--color-text-muted)',
                              marginTop: 1,
                            }}
                          >
                            {section.detail} • {section.items.length} item{section.items.length === 1 ? '' : 's'}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.05em',
                          padding: '4px 10px',
                          borderRadius: 5,
                          background:
                            status === 'complete'
                              ? 'var(--color-success-bg)'
                              : status === 'in_progress'
                                ? 'var(--color-warning-bg)'
                                : 'var(--color-bg-card)',
                          color:
                            status === 'complete'
                              ? 'var(--color-success)'
                              : status === 'in_progress'
                                ? 'var(--color-warning)'
                                : 'var(--color-text-muted)',
                          border:
                            status === 'complete'
                              ? '1px solid var(--color-success-border)'
                              : status === 'in_progress'
                                ? '1px solid var(--color-warning-border)'
                                : '1px solid var(--color-border)',
                        }}
                      >
                        {status === 'complete' ? 'Complete' : status === 'in_progress' ? 'In Progress' : 'Not Started'}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '12px 20px 16px',
                        background: 'var(--color-bg)',
                        borderTop: '1px solid var(--color-border)',
                      }}
                    >
                      {section.items.map((item, ii) => {
                        const key = `${si}-${ii}`;
                        return (
                          <label
                            key={ii}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '6px 0',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checks[key] || false}
                              onChange={() => toggleCheck(key)}
                              style={{ accentColor: 'var(--color-success)' }}
                            />
                            <span
                              style={{
                                fontSize: 12.5,
                                color: 'var(--color-text-secondary)',
                                textDecoration: checks[key] ? 'line-through' : 'none',
                              }}
                            >
                              {item}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mark Complete button */}
            <div
              style={{
                marginTop: 24,
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => checkedCount === totalItems && setMarkedComplete(true)}
                disabled={checkedCount !== totalItems}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 8,
                  background: checkedCount === totalItems ? 'var(--color-success)' : 'var(--color-bg-card)',
                  border: checkedCount === totalItems ? 'none' : '1px solid var(--color-border)',
                  color: checkedCount === totalItems ? '#fff' : 'var(--color-text-muted)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: checkedCount === totalItems ? 'pointer' : 'not-allowed',
                  opacity: checkedCount === totalItems ? 1 : 0.5,
                }}
              >
                <Icon name="check" size={14} color={checkedCount === totalItems ? '#fff' : 'var(--color-text-muted)'} />
                Mark Complete
              </button>
            </div>

            {/* Completion confirmation */}
            {markedComplete && (
              <div
                style={{
                  marginTop: 16,
                  padding: '16px 20px',
                  background: 'var(--color-success-bg)',
                  borderRadius: 10,
                  border: '1px solid var(--color-success-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Icon name="check" size={15} color="var(--color-success)" />
                <div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-success)',
                      display: 'block',
                      marginBottom: 2,
                    }}
                  >
                    Checklist marked complete
                  </span>
                  <span
                    style={{
                      fontSize: 12.5,
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.6,
                    }}
                  >
                    Record completion in your QMS change control per internal procedure.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
