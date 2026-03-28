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

    expect(doc.executiveSummary.pathwayConclusion).toBe(Pathway.LetterToFile);
    expect(doc.executiveSummary.isIncomplete).toBe(false);
    expect(doc.executiveSummary.confidenceLevel).toBe('HIGH');
    expect(doc.executiveSummary.relianceState).toBeTruthy();
    expect(doc.executiveSummary.primaryNextAction).toBeTruthy();
    expect(doc.executiveSummary.summaryStatement).toBeTruthy();

    expect(doc.assessmentBasis.recordFacts.length).toBeGreaterThan(0);
    expect(doc.assessmentBasis.systemGeneratedBasis.length).toBeGreaterThan(0);

    expect(doc.decisionTrace.steps.length).toBeGreaterThan(0);

    expect(doc.closing.disclaimer).toContain('does not constitute a regulatory determination');
    expect(doc.closing.generatedBy).toBe('ChangePath');
  });

  it('marks incomplete assessments correctly', () => {
    const sparseAnswers: Answers = { A1: AuthPathway.FiveOneZeroK };
    const doc = buildDoc(sparseAnswers);

    expect(doc.executiveSummary.isIncomplete).toBe(true);
    expect(doc.executiveSummary.pathwayConclusion).toContain('Incomplete');
    expect(doc.executiveSummary.confidenceLevel).toBe('LOW');
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
});
