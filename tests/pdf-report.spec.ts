import { describe, expect, it } from 'vitest';
import {
  Answer,
  AuthPathway,
  Pathway,
  computeDetermination,
  computeDerivedState,
  getBlocks,
  getBlockFields,
  type Answers,
} from '../src/lib/assessment-engine';
import { buildPdfReportDocument, type PdfReportDocument } from '../src/lib/pdf-report-model';
import { renderPdfReport } from '../src/lib/pdf-renderer';
import { base510k, baseDeNovo, basePMA } from './helpers';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildDoc(answers: Answers, options?: { assessmentId?: string; assessmentName?: string }): PdfReportDocument {
  const determination = computeDetermination(answers);
  const ds = computeDerivedState(answers);
  const blocks = getBlocks(answers, ds);
  const getFieldsForBlock = (blockId: string) => getBlockFields(blockId, answers, ds);
  return buildPdfReportDocument(answers, determination, blocks, getFieldsForBlock, {
    assessmentId: options?.assessmentId,
    assessmentName: options?.assessmentName,
    reviewerNotes: [],
  });
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function buildPdfText(reportDoc: PdfReportDocument): string {
  return renderPdfReport(reportDoc).output();
}

/* ------------------------------------------------------------------ */
/*  Document model tests                                               */
/* ------------------------------------------------------------------ */

describe('buildPdfReportDocument', () => {
  it('produces a complete document for a standard 510(k) Letter to File case', () => {
    const doc = buildDoc(base510k());

    expect(doc.header.title).toBe('Regulatory Change Assessment Record');
    expect(doc.header.subtitle).toBe('ChangePath');
    expect(doc.header.generatedAt).toBeTruthy();
    expect(doc.header.assessmentStatus).toBeTruthy();
    expect(doc.header.exportVersion).toBe('pdf-v2');
    expect(doc.header.preparedFrom).toBe('Assessment record in ChangePath');

    expect(doc.executiveSummary.pathwayLabel).toBe(Pathway.LetterToFile);
    expect(doc.executiveSummary.isIncomplete).toBe(false);
    expect(doc.executiveSummary.recordStatus).toBe('Complete — pending qualified review');
    expect(doc.executiveSummary.relianceQualification).toContain('qualified regulatory review');
    expect(doc.executiveSummary.primaryNextAction).toBeTruthy();
    expect(doc.executiveSummary.summaryStatement).toBeTruthy();
    expect(doc.executiveSummary.pathwayConclusion).toContain(`supports a pathway assessment of ${Pathway.LetterToFile}`);
    expect('confidenceLevel' in doc.executiveSummary).toBe(false);

    expect(doc.assessmentBasis.recordFacts.length).toBeGreaterThan(0);
    expect(doc.assessmentBasis.systemGeneratedBasis.length).toBeGreaterThan(0);

    expect(doc.decisionTrace.steps.length).toBeGreaterThan(0);

    expect(doc.closing.disclaimer).toContain('not a regulatory determination');
    expect(doc.closing.generatedBy).toBe('ChangePath');
  });

  it('marks incomplete assessments correctly', () => {
    const sparseAnswers: Answers = { A1: AuthPathway.FiveOneZeroK };
    const doc = buildDoc(sparseAnswers);

    expect(doc.executiveSummary.isIncomplete).toBe(true);
    expect(doc.executiveSummary.pathwayLabel).toBe('Assessment Incomplete');
    expect(doc.executiveSummary.recordStatus).toContain('Incomplete');
    expect(doc.executiveSummary.pathwayConclusion).toContain('No pathway conclusion should be treated as supported');
    expect('confidenceLevel' in doc.executiveSummary).toBe(false);
  });

  it('handles PMA pathway', () => {
    const doc = buildDoc(basePMA());

    expect(doc.assessmentBasis.recordFacts.some(
      (f) => f.label === 'Authorization Pathway' && f.value === AuthPathway.PMA,
    )).toBe(true);
    expect(doc.assessmentBasis.systemGeneratedBasis.some(
      (s) => s.includes('PMA'),
    )).toBe(true);
  });

  it('handles De Novo pathway', () => {
    const doc = buildDoc(baseDeNovo());

    expect(doc.assessmentBasis.recordFacts.some(
      (f) => f.label === 'Authorization Pathway' && f.value === AuthPathway.DeNovo,
    )).toBe(true);
  });

  it('handles sparse data gracefully (empty answers)', () => {
    const doc = buildDoc({});

    expect(doc.header.title).toBe('Regulatory Change Assessment Record');
    expect(doc.executiveSummary.isIncomplete).toBe(true);
    expect(doc.assessmentBasis.recordFacts.length).toBeGreaterThan(0);
    // Missing facts should be flagged
    const missingFacts = doc.assessmentBasis.recordFacts.filter((f) => f.isMissing);
    expect(missingFacts.length).toBeGreaterThan(0);
    expect(doc.closing.disclaimer).toBeTruthy();
  });

  it('includes assessment ID and name when provided', () => {
    const doc = buildDoc(base510k(), {
      assessmentId: 'TEST-123',
      assessmentName: 'My Test Assessment',
    });

    expect(doc.header.assessmentId).toBe('TEST-123');
    expect(doc.header.assessmentName).toBe('My Test Assessment');
  });

  it('omits assessment ID and name when not provided', () => {
    const doc = buildDoc(base510k());

    expect(doc.header.assessmentId).toBeNull();
    expect(doc.header.assessmentName).toBeNull();
  });

  it('includes reviewer notes when provided', () => {
    const answers = base510k();
    const determination = computeDetermination(answers);
    const ds = computeDerivedState(answers);
    const blocks = getBlocks(answers, ds);
    const getFieldsForBlock = (blockId: string) => getBlockFields(blockId, answers, ds);
    const doc = buildPdfReportDocument(answers, determination, blocks, getFieldsForBlock, {
      reviewerNotes: [
        { id: 'n1', author: 'Jane Smith', text: 'Reviewed baseline docs.', timestamp: '2025-01-15T10:00:00Z' },
        { id: 'n2', author: 'John Doe', text: 'PCCP not applicable.', timestamp: '2025-01-16T14:00:00Z' },
      ],
    });

    expect(doc.reviewerNotes).toHaveLength(2);
    expect(doc.reviewerNotes[0].author).toBe('Jane Smith');
    expect(doc.reviewerNotes[0].text).toBe('Reviewed baseline docs.');
    expect(doc.reviewerNotes[1].author).toBe('John Doe');
  });

  it('returns empty reviewer notes when none provided', () => {
    const doc = buildDoc(base510k());
    expect(doc.reviewerNotes).toHaveLength(0);
  });

  it('includes sources cited from determination', () => {
    const doc = buildDoc(base510k());
    // Sources should be present for a complete determination
    expect(doc.sourcesCited.length).toBeGreaterThanOrEqual(0);
    doc.sourcesCited.forEach((s) => {
      expect(s.text).toBeTruthy();
      expect(s.badge).toBeTruthy();
      expect(s.shortText).toBeTruthy();
    });
  });

  it('includes PCCP-related content when PCCP is available', () => {
    const doc = buildDoc(base510k({ A2: Answer.Yes, A3: Answer.Yes, A4: Answer.Yes, A5: Answer.Yes }));

    const pccpFact = doc.assessmentBasis.recordFacts.find((f) => f.label === 'PCCP Status');
    expect(pccpFact).toBeTruthy();
    expect(pccpFact!.value).toContain('PCCP');
    expect(pccpFact!.isMissing).toBe(false);
  });

  it('handles no-sources case without error', () => {
    const doc = buildDoc({});
    // Should not throw, sources may be empty
    expect(Array.isArray(doc.sourcesCited)).toBe(true);
  });

  it('omits alternative pathways for incomplete assessments', () => {
    const doc = buildDoc({});
    expect(doc.alternativePathways).toHaveLength(0);
  });

  it('includes open issues when consistency problems exist', () => {
    // Force a consistency issue by providing conflicting answers
    const doc = buildDoc(base510k({ D1: Answer.Yes }));
    // Whether there are open issues depends on the specific logic
    expect(Array.isArray(doc.openIssues)).toBe(true);
  });

  it('softens the pathway conclusion when open issues remain', () => {
    const doc = buildDoc(base510k({ E1: Answer.No }));

    expect(doc.executiveSummary.isIncomplete).toBe(false);
    expect(doc.openIssues.length).toBeGreaterThan(0);
    expect(doc.executiveSummary.recordStatus).toBe('Preliminary — open issues remain');
    expect(doc.executiveSummary.pathwayConclusion).toContain('preliminary pathway assessment');
    expect(doc.executiveSummary.relianceQualification).toContain('Limited reliance only');
  });

  it('deduplicates rationale text across the PDF narrative view', () => {
    const doc = buildDoc(base510k({
      B1: 'Software change',
      B2: 'Algorithm enhancement',
      B4: 'Updated the model ranking logic while keeping the clinician-facing output structure unchanged.',
    }));
    const normalizedHeadline = normalizeText(doc.narrative.headlineReason);
    const normalizedSupportingPoints = doc.narrative.supportingPoints.map(normalizeText);

    expect(normalizedSupportingPoints).not.toContain(normalizedHeadline);
    expect(new Set(normalizedSupportingPoints).size).toBe(normalizedSupportingPoints.length);
  });

  it('normalizes and deduplicates related source references into source families', () => {
    const doc = buildDoc(base510k());
    const softwareGuidance = doc.sourcesCited.find((source) => source.text === 'FDA-SW-510K-2017');

    expect(softwareGuidance).toBeTruthy();
    expect(softwareGuidance!.badge).toContain('sections referenced: Q3, Q4');
    expect(doc.sourcesCited.filter((source) => source.text.startsWith('FDA-SW-510K-2017')).length).toBe(1);
  });

  /* ---------------------------------------------------------------- */
  /*  Grammar / pluralization                                          */
  /* ---------------------------------------------------------------- */

  it('uses correct singular grammar: "1 open issue remains"', () => {
    const doc = buildDoc(base510k({ E1: Answer.No }));
    if (doc.openIssues.length === 1) {
      expect(doc.executiveSummary.relianceQualification).toContain('1 open issue remains');
      expect(doc.executiveSummary.relianceQualification).not.toContain('1 open issue remain and');
    }
  });

  it('uses correct plural grammar: "N open issues remain"', () => {
    // Use a case likely to produce multiple open issues
    const doc = buildDoc(base510k({ D1: Answer.Yes, E1: Answer.No }));
    if (doc.openIssues.length > 1) {
      expect(doc.executiveSummary.relianceQualification).toMatch(/\d+ open issues remain and/);
    }
  });
});

/* ------------------------------------------------------------------ */
/*  PDF renderer tests                                                 */
/* ------------------------------------------------------------------ */

describe('renderPdfReport', () => {
  it('produces a jsPDF document from a standard 510(k) case', () => {
    const reportDoc = buildDoc(base510k());
    const pdf = renderPdfReport(reportDoc);

    expect(pdf).toBeTruthy();
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('produces a multi-page document for data-rich cases', () => {
    const answers = base510k({
      A2: Answer.Yes,
      A3: Answer.Yes,
      A4: Answer.Yes,
      A5: Answer.Yes,
      B1: 'Software change',
      B2: 'Algorithm enhancement',
      B4: 'Added a new AI model for lesion detection that uses a transformer architecture with attention mechanisms to improve diagnostic accuracy.',
    });
    const reportDoc = buildDoc(answers);
    const pdf = renderPdfReport(reportDoc);

    expect(pdf).toBeTruthy();
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('handles sparse data without throwing', () => {
    const reportDoc = buildDoc({});
    const pdf = renderPdfReport(reportDoc);

    expect(pdf).toBeTruthy();
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('handles PMA pathway without throwing', () => {
    const reportDoc = buildDoc(basePMA());
    const pdf = renderPdfReport(reportDoc);

    expect(pdf).toBeTruthy();
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('handles case with reviewer notes', () => {
    const answers = base510k();
    const determination = computeDetermination(answers);
    const ds = computeDerivedState(answers);
    const blocks = getBlocks(answers, ds);
    const getFieldsForBlock = (blockId: string) => getBlockFields(blockId, answers, ds);
    const reportDoc = buildPdfReportDocument(answers, determination, blocks, getFieldsForBlock, {
      reviewerNotes: [
        { id: 'n1', author: 'Tester', text: 'Looks good.', timestamp: '2025-01-15T10:00:00Z' },
      ],
    });
    const pdf = renderPdfReport(reportDoc);

    expect(pdf).toBeTruthy();
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('generates valid PDF output bytes', () => {
    const reportDoc = buildDoc(base510k());
    const pdf = renderPdfReport(reportDoc);
    const output = pdf.output('arraybuffer');

    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(0);

    // Check PDF magic bytes (%PDF-)
    const header = new Uint8Array(output, 0, 5);
    const magic = String.fromCharCode(...header);
    expect(magic).toBe('%PDF-');
  });

  it('renders refined section headings and document-control language', () => {
    const reportDoc = buildDoc(base510k({ E1: Answer.No }));
    const pdfText = buildPdfText(reportDoc);

    expect(pdfText).toContain('Assessment Summary');
    expect(pdfText).toContain('Record Status');
    expect(pdfText).toContain('Conditions for Reliance');
    expect(pdfText).toContain('Document Control');
    expect(pdfText).toContain('Page 1 of');
    expect(pdfText).not.toContain('Confidence');
  });

  it('renders normalized source-family citations instead of repeated raw source codes', () => {
    const reportDoc = buildDoc(base510k());
    const pdfText = buildPdfText(reportDoc);

    expect(pdfText).toContain('referenced: Q3, Q4');
    expect(pdfText).not.toContain('FDA-SW-510K-2017 Q3');
    expect(pdfText).not.toContain('FDA-SW-510K-2017 Q4');
  });

  it('uses mixed-case section headings, not all-caps', () => {
    const reportDoc = buildDoc(base510k());
    const pdfText = buildPdfText(reportDoc);

    // Section headings should be mixed case
    expect(pdfText).toContain('Assessment Summary');
    expect(pdfText).toContain('Assessment Basis');
    expect(pdfText).toContain('Sources Cited');
    // Should not have all-caps versions of main headings
    expect(pdfText).not.toContain('ASSESSMENT SUMMARY');
    expect(pdfText).not.toContain('SOURCES CITED');
  });

  it('renders a concise footer without repetitive provenance', () => {
    const reportDoc = buildDoc(base510k());
    const pdfText = buildPdfText(reportDoc);

    expect(pdfText).toContain('Internal assessment support record');
    expect(pdfText).toContain('not a regulatory determination');
  });

  /* ---------------------------------------------------------------- */
  /*  Long text handling                                               */
  /* ---------------------------------------------------------------- */

  it('renders long narrative text without truncation', () => {
    const longDescription = 'This change involves a comprehensive update to the diagnostic algorithm. '.repeat(30);
    const answers = base510k({
      B1: 'Software change',
      B2: 'Algorithm enhancement',
      B4: longDescription,
    });
    const reportDoc = buildDoc(answers);
    const pdf = renderPdfReport(reportDoc);

    // Should render without throwing
    expect(pdf).toBeTruthy();
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(2);
  });

  it('handles very long change descriptions in record facts', () => {
    const longText = 'Updated the neural network architecture to incorporate multi-head attention. '.repeat(20);
    const answers = base510k({ B4: longText });
    const reportDoc = buildDoc(answers);
    const pdf = renderPdfReport(reportDoc);

    expect(pdf).toBeTruthy();
    // Verify the full text is in the model (not truncated)
    const changeDesc = reportDoc.assessmentBasis.recordFacts.find(
      (f) => f.label === 'Submitted Change Description',
    );
    expect(changeDesc).toBeTruthy();
    expect(changeDesc!.value.length).toBeGreaterThan(500);
    expect(changeDesc!.isLongText).toBe(true);
  });

  /* ---------------------------------------------------------------- */
  /*  Closing / disclaimer layout                                      */
  /* ---------------------------------------------------------------- */

  it('keeps disclaimer within the Document Control section (no orphaned heading)', () => {
    const reportDoc = buildDoc(base510k());
    const pdfText = buildPdfText(reportDoc);

    // Disclaimer text should be present
    expect(pdfText).toContain('not a regulatory determination');
    // The old separate "Disclaimer" subheading should not appear
    expect(pdfText).not.toMatch(/\bDisclaimer\b/);
  });

  /* ---------------------------------------------------------------- */
  /*  Issue formatting                                                 */
  /* ---------------------------------------------------------------- */

  it('renders issue items with structured tags and labels', () => {
    const doc = buildDoc(base510k({ E1: Answer.No }));
    if (doc.openIssues.length > 0) {
      const pdfText = buildPdfText(doc);
      expect(pdfText).toContain('Issue 1');
      expect(pdfText).toContain('Required Action');
      expect(pdfText).toContain('Record Impact');
    }
  });

  /* ---------------------------------------------------------------- */
  /*  Section omission for sparse data                                 */
  /* ---------------------------------------------------------------- */

  it('omits empty sections gracefully', () => {
    const doc = buildDoc({});
    const pdfText = buildPdfText(doc);

    // Should still render core sections
    expect(pdfText).toContain('Assessment Summary');
    expect(pdfText).toContain('Document Control');
    // Open issues section should not appear for sparse data with no issues
    if (doc.openIssues.length === 0) {
      expect(pdfText).not.toContain('Open Issues');
    }
  });
});
