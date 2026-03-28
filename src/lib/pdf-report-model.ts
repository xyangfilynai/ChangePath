/**
 * Normalized PDF report document model.
 *
 * Assembles the structured data needed for a regulatory assessment PDF
 * from the same underlying logic that powers the on-screen review page.
 * This model is intentionally UI-free — it captures document content only.
 */

import type { Answers, Block, DeterminationResult, AssessmentField } from './assessment-engine';
import { Pathway } from './assessment-engine';
import type { ReviewerNote } from './assessment-store';
import { generateAssessmentArtifact, type AssessmentArtifact } from './report-generator';
import { buildAssessmentBasisView, type AssessmentBasisView } from './report-basis';
import { getSourceBadge } from './content';

/* ------------------------------------------------------------------ */
/*  Document model types                                               */
/* ------------------------------------------------------------------ */

export interface PdfReportHeader {
  title: string;
  subtitle: string;
  generatedAt: string;
  assessmentId: string | null;
  assessmentName: string | null;
  assessmentStatus: string;
  schemaVersion: string;
}

export interface PdfExecutiveSummary {
  pathwayConclusion: string;
  relianceState: string;
  relianceDetail: string;
  primaryNextAction: string;
  summaryStatement: string;
  confidenceLevel: string;
  isIncomplete: boolean;
}

export interface PdfAssessmentBasisFact {
  label: string;
  value: string;
  isMissing: boolean;
}

export interface PdfAssessmentBasis {
  recordFacts: PdfAssessmentBasisFact[];
  systemGeneratedBasis: string[];
}

export interface PdfDecisionTrace {
  steps: string[];
}

export interface PdfAssessmentNarrative {
  headlineReason: string;
  supportingPoints: string[];
  verificationTitle: string | null;
  verificationSteps: string[];
}

export interface PdfOpenIssue {
  title: string;
  meta: string;
  whyItMatters: string;
  actionNeeded: string;
  actionLabel: string;
  sources: string[];
  kind: 'expert-review' | 'evidence-gap';
}

export interface PdfAlternativePathway {
  description: string;
}

export interface PdfSourceCitation {
  text: string;
  badge: string;
}

export interface PdfReviewerNote {
  author: string;
  text: string;
  timestamp: string;
}

export interface PdfReportDocument {
  header: PdfReportHeader;
  executiveSummary: PdfExecutiveSummary;
  assessmentBasis: PdfAssessmentBasis;
  decisionTrace: PdfDecisionTrace;
  narrative: PdfAssessmentNarrative;
  openIssues: PdfOpenIssue[];
  alternativePathways: PdfAlternativePathway[];
  sourcesCited: PdfSourceCitation[];
  reviewerNotes: PdfReviewerNote[];
  closing: {
    generatedBy: string;
    timestamp: string;
    disclaimer: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getRelianceState(
  artifact: AssessmentArtifact,
  mergedIssueCount: number,
): { label: string; detail: string } {
  if (artifact.outcome.isIncomplete) {
    return {
      label: 'Not ready for reliance',
      detail: 'Pathway-critical fields remain open; the record should not be treated as final.',
    };
  }
  if (mergedIssueCount > 0) {
    return {
      label: 'Open issues remain',
      detail: `${mergedIssueCount} open issue${mergedIssueCount === 1 ? '' : 's'} remain on the current record.`,
    };
  }
  return {
    label: 'Ready for review',
    detail: 'No open issues are listed on the current record. Continue with standard expert review and QMS controls before action.',
  };
}

function getPrimaryAction(determination: DeterminationResult, pathway: string): string {
  if (pathway === Pathway.LetterToFile || pathway === Pathway.PMAAnnualReport) {
    return 'Document the rationale and file the record per QMS.';
  }
  if (pathway === Pathway.ImplementPCCP) {
    return 'Complete the authorized PCCP validation protocol before implementation.';
  }
  if (pathway === Pathway.NewSubmission) {
    return 'Prepare the submission package for the selected 510(k) or De Novo strategy.';
  }
  if (pathway === Pathway.PMASupplementRequired) {
    return 'Confirm the PMA supplement type and assemble the supporting package.';
  }
  if (determination.isIntendedUseUncertain) {
    return 'Resolve intended-use uncertainty before treating this assessment as final.';
  }
  if (determination.hasUncertainSignificance) {
    return 'Close unresolved significance fields with supporting evidence and review.';
  }
  return 'Complete the remaining pathway-critical fields before reliance.';
}

function formatSourceRef(sourceRef: string): PdfSourceCitation {
  const badge = getSourceBadge(sourceRef);
  return {
    text: sourceRef,
    badge: badge.full || sourceRef,
  };
}

function deduplicateAndMergeIssues(
  artifact: AssessmentArtifact,
): PdfOpenIssue[] {
  const seen = new Map<string, PdfOpenIssue>();

  for (const item of artifact.expertReviewItems) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!seen.has(key)) {
      seen.set(key, {
        title: item.title,
        meta: item.meta,
        whyItMatters: item.whyThisMatters,
        actionNeeded: item.actionText,
        actionLabel: item.actionLabel,
        sources: item.sourceRefs,
        kind: 'expert-review',
      });
    }
  }

  for (const item of artifact.evidenceGapItems) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!seen.has(key)) {
      seen.set(key, {
        title: item.title,
        meta: item.meta,
        whyItMatters: item.whyThisMatters,
        actionNeeded: item.actionText,
        actionLabel: item.actionLabel,
        sources: item.sourceRefs,
        kind: 'evidence-gap',
      });
    }
  }

  return Array.from(seen.values()).sort((a, b) => {
    const aPriority = a.kind === 'expert-review' ? 1 : 2;
    const bPriority = b.kind === 'expert-review' ? 1 : 2;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.title.localeCompare(b.title);
  });
}

/* ------------------------------------------------------------------ */
/*  Model builder                                                      */
/* ------------------------------------------------------------------ */

export function buildPdfReportDocument(
  answers: Answers,
  determination: DeterminationResult,
  blocks: Block[],
  getFieldsForBlock: (blockId: string) => AssessmentField[],
  options?: {
    assessmentId?: string;
    assessmentName?: string;
    reviewerNotes?: ReviewerNote[];
  },
): PdfReportDocument {
  const artifact = generateAssessmentArtifact(answers, determination, blocks, getFieldsForBlock);
  const basisView: AssessmentBasisView = buildAssessmentBasisView(answers, determination);
  const openIssues = deduplicateAndMergeIssues(artifact);
  const relianceState = getRelianceState(artifact, openIssues.length);
  const pathway = determination.pathway;
  const generatedAt = new Date().toISOString();

  // Collect all cited sources, deduplicated
  const sourceSet = new Set<string>();
  artifact.rationale.sources.forEach((s) => sourceSet.add(s));
  openIssues.forEach((issue) => issue.sources.forEach((s) => sourceSet.add(s)));

  // Alternative pathways — only include if counter-considerations exist and assessment is not incomplete
  const alternativePathways: PdfAlternativePathway[] = [];
  if (!artifact.outcome.isIncomplete && artifact.rationale.counterConsiderations.length > 0) {
    artifact.rationale.counterConsiderations.slice(0, 4).forEach((desc) => {
      alternativePathways.push({ description: desc });
    });
  }

  return {
    header: {
      title: 'Regulatory Change Assessment Record',
      subtitle: 'ChangePath',
      generatedAt,
      assessmentId: options?.assessmentId || null,
      assessmentName: options?.assessmentName || null,
      assessmentStatus: artifact.meta.assessmentStatus,
      schemaVersion: artifact.meta.toolVersion,
    },

    executiveSummary: {
      pathwayConclusion: artifact.outcome.isIncomplete
        ? `Assessment Incomplete — ${pathway}`
        : pathway,
      relianceState: relianceState.label,
      relianceDetail: relianceState.detail,
      primaryNextAction: getPrimaryAction(determination, pathway),
      summaryStatement: artifact.rationale.headlineReason || artifact.rationale.primaryReason,
      confidenceLevel: artifact.outcome.confidenceLevel,
      isIncomplete: artifact.outcome.isIncomplete,
    },

    assessmentBasis: {
      recordFacts: basisView.recordFacts.map((f) => ({
        label: f.label,
        value: f.value,
        isMissing: f.isMissing ?? false,
      })),
      systemGeneratedBasis: basisView.systemBasis,
    },

    decisionTrace: {
      steps: artifact.rationale.decisionPath.filter((step) => !step.startsWith('Result:')),
    },

    narrative: {
      headlineReason: artifact.rationale.headlineReason || artifact.rationale.primaryReason,
      supportingPoints: artifact.rationale.narrative.filter(Boolean).slice(1),
      verificationTitle: artifact.rationale.verificationTitle,
      verificationSteps: artifact.rationale.verificationSteps,
    },

    openIssues,

    alternativePathways,

    sourcesCited: Array.from(sourceSet).map(formatSourceRef),

    reviewerNotes: (options?.reviewerNotes || []).map((note) => ({
      author: note.author,
      text: note.text,
      timestamp: note.timestamp,
    })),

    closing: {
      generatedBy: 'ChangePath',
      timestamp: generatedAt,
      disclaimer:
        'This document is an internal assessment support record generated by ChangePath. ' +
        'It does not constitute a regulatory determination, legal opinion, or binding conclusion. ' +
        'All outputs must be reviewed by qualified regulatory, clinical, and quality personnel ' +
        'against applicable regulations, guidance, and organizational procedures before any reliance or action.',
    },
  };
}
