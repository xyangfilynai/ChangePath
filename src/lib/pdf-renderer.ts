/**
 * PDF document renderer for regulatory assessment records.
 *
 * Converts a PdfReportDocument model into a real PDF using jsPDF.
 * Handles layout, pagination, headers/footers, and typographic hierarchy.
 */

import { jsPDF } from 'jspdf';
import type { PdfReportDocument, PdfOpenIssue, PdfSourceCitation } from './pdf-report-model';

/* ------------------------------------------------------------------ */
/*  Layout constants                                                   */
/* ------------------------------------------------------------------ */

const PAGE = {
  width: 210,       // A4 mm
  height: 297,
  marginLeft: 22,
  marginRight: 22,
  marginTop: 28,
  marginBottom: 26,
  headerHeight: 16,
  footerHeight: 12,
} as const;

const CONTENT_WIDTH = PAGE.width - PAGE.marginLeft - PAGE.marginRight;
const CONTENT_TOP = PAGE.marginTop + PAGE.headerHeight;
const CONTENT_BOTTOM = PAGE.height - PAGE.marginBottom - PAGE.footerHeight;

/* ------------------------------------------------------------------ */
/*  Color palette — restrained, professional                           */
/* ------------------------------------------------------------------ */

const COLOR = {
  text: [33, 37, 41] as [number, number, number],
  textSecondary: [108, 117, 125] as [number, number, number],
  textMuted: [155, 163, 172] as [number, number, number],
  accent: [37, 99, 160] as [number, number, number],
  border: [210, 214, 218] as [number, number, number],
  sectionBg: [245, 247, 249] as [number, number, number],
  missingText: [180, 180, 180] as [number, number, number],
  tagBg: [235, 238, 242] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

/* ------------------------------------------------------------------ */
/*  Font size constants                                                */
/* ------------------------------------------------------------------ */

const FONT = {
  title: 18,
  h1: 14,
  h2: 11,
  body: 9.5,
  small: 8.5,
  tiny: 7.5,
  label: 7,
} as const;

/* ------------------------------------------------------------------ */
/*  Cursor — tracks the current Y position and page count              */
/* ------------------------------------------------------------------ */

class Cursor {
  y: number;
  page: number;
  private doc: jsPDF;
  private reportDoc: PdfReportDocument;

  constructor(doc: jsPDF, reportDoc: PdfReportDocument) {
    this.doc = doc;
    this.reportDoc = reportDoc;
    this.y = CONTENT_TOP;
    this.page = 1;
  }

  ensureSpace(needed: number): void {
    if (this.y + needed > CONTENT_BOTTOM) {
      this.newPage();
    }
  }

  newPage(): void {
    this.doc.addPage();
    this.page++;
    this.y = CONTENT_TOP;
    renderPageHeader(this.doc, this.reportDoc);
    renderPageFooter(this.doc, this.reportDoc, this.page);
  }

  advance(dy: number): void {
    this.y += dy;
  }
}

/* ------------------------------------------------------------------ */
/*  Text utilities                                                     */
/* ------------------------------------------------------------------ */

function splitLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function textHeight(doc: jsPDF, text: string, maxWidth: number, fontSize: number): number {
  doc.setFontSize(fontSize);
  const lines = splitLines(doc, text, maxWidth);
  return lines.length * fontSize * 0.42;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return iso;
  }
}

function formatDateShort(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/*  Page header & footer                                               */
/* ------------------------------------------------------------------ */

function renderPageHeader(doc: jsPDF, reportDoc: PdfReportDocument): void {
  const y = PAGE.marginTop;

  doc.setFontSize(FONT.tiny);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.textMuted);
  doc.text(reportDoc.header.title, PAGE.marginLeft, y);

  const rightText = reportDoc.header.assessmentId
    ? `ID: ${reportDoc.header.assessmentId}`
    : formatDateShort(reportDoc.header.generatedAt);
  doc.text(rightText, PAGE.width - PAGE.marginRight, y, { align: 'right' });

  // Thin rule below header
  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.3);
  doc.line(PAGE.marginLeft, y + 3, PAGE.width - PAGE.marginRight, y + 3);
}

function renderPageFooter(doc: jsPDF, reportDoc: PdfReportDocument, pageNum: number): void {
  const y = PAGE.height - PAGE.marginBottom;

  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.3);
  doc.line(PAGE.marginLeft, y - 4, PAGE.width - PAGE.marginRight, y - 4);

  doc.setFontSize(FONT.label);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.textMuted);

  doc.text(
    'Internal use only — not a regulatory determination',
    PAGE.marginLeft,
    y,
  );

  doc.text(
    `Page ${pageNum}`,
    PAGE.width - PAGE.marginRight,
    y,
    { align: 'right' },
  );
}

/* ------------------------------------------------------------------ */
/*  Section heading                                                    */
/* ------------------------------------------------------------------ */

function renderSectionHeading(doc: jsPDF, cursor: Cursor, title: string): void {
  cursor.ensureSpace(14);

  if (cursor.y > CONTENT_TOP + 5) {
    cursor.advance(6);
  }

  // Section rule
  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.2);
  doc.line(PAGE.marginLeft, cursor.y, PAGE.width - PAGE.marginRight, cursor.y);
  cursor.advance(6);

  doc.setFontSize(FONT.h1);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.accent);
  doc.text(title.toUpperCase(), PAGE.marginLeft, cursor.y);
  cursor.advance(8);
}

function renderSubheading(doc: jsPDF, cursor: Cursor, title: string): void {
  cursor.ensureSpace(10);
  cursor.advance(3);

  doc.setFontSize(FONT.h2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.text);
  doc.text(title, PAGE.marginLeft, cursor.y);
  cursor.advance(5);
}

/* ------------------------------------------------------------------ */
/*  Body text                                                          */
/* ------------------------------------------------------------------ */

function renderBodyText(doc: jsPDF, cursor: Cursor, text: string, indent = 0): void {
  const maxW = CONTENT_WIDTH - indent;
  const h = textHeight(doc, text, maxW, FONT.body);
  cursor.ensureSpace(h + 2);

  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.text);
  const lines = splitLines(doc, text, maxW);
  doc.text(lines, PAGE.marginLeft + indent, cursor.y);
  cursor.advance(h + 2);
}

function renderBodyTextSecondary(doc: jsPDF, cursor: Cursor, text: string, indent = 0): void {
  const maxW = CONTENT_WIDTH - indent;
  const h = textHeight(doc, text, maxW, FONT.body);
  cursor.ensureSpace(h + 2);

  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.textSecondary);
  const lines = splitLines(doc, text, maxW);
  doc.text(lines, PAGE.marginLeft + indent, cursor.y);
  cursor.advance(h + 2);
}

function renderLabelValue(
  doc: jsPDF,
  cursor: Cursor,
  label: string,
  value: string,
  isMissing = false,
): void {
  const labelWidth = 56;
  const valueWidth = CONTENT_WIDTH - labelWidth - 2;
  const valueH = textHeight(doc, value, valueWidth, FONT.body);
  const rowH = Math.max(valueH, 5) + 2;
  cursor.ensureSpace(rowH);

  doc.setFontSize(FONT.small);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.textSecondary);
  doc.text(label, PAGE.marginLeft, cursor.y);

  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...(isMissing ? COLOR.missingText : COLOR.text));
  const lines = splitLines(doc, value, valueWidth);
  doc.text(lines, PAGE.marginLeft + labelWidth, cursor.y);
  cursor.advance(rowH);
}

/* ------------------------------------------------------------------ */
/*  Numbered list                                                      */
/* ------------------------------------------------------------------ */

function renderNumberedList(
  doc: jsPDF,
  cursor: Cursor,
  items: string[],
  options?: { indent?: number; fontSize?: number },
): void {
  const indent = options?.indent ?? 6;
  const fontSize = options?.fontSize ?? FONT.body;
  const numWidth = 8;
  const textWidth = CONTENT_WIDTH - indent - numWidth;

  items.forEach((item, i) => {
    const h = textHeight(doc, item, textWidth, fontSize);
    cursor.ensureSpace(h + 2);

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.textSecondary);
    doc.text(`${i + 1}.`, PAGE.marginLeft + indent, cursor.y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.text);
    const lines = splitLines(doc, item, textWidth);
    doc.text(lines, PAGE.marginLeft + indent + numWidth, cursor.y);
    cursor.advance(h + 2);
  });
}

/* ------------------------------------------------------------------ */
/*  Tag / badge                                                        */
/* ------------------------------------------------------------------ */

function renderTag(doc: jsPDF, cursor: Cursor, label: string, x?: number): void {
  const tagX = x ?? PAGE.marginLeft;
  doc.setFontSize(FONT.label);
  const tagWidth = doc.getTextWidth(label) + 6;
  const tagH = 4.5;

  doc.setFillColor(...COLOR.tagBg);
  doc.roundedRect(tagX, cursor.y - 3, tagWidth, tagH, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.textSecondary);
  doc.text(label, tagX + 3, cursor.y);
}

/* ------------------------------------------------------------------ */
/*  Section renderers                                                  */
/* ------------------------------------------------------------------ */

function renderTitlePage(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  // Main title
  doc.setFontSize(FONT.title);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.text);
  doc.text(reportDoc.header.title, PAGE.marginLeft, cursor.y);
  cursor.advance(8);

  doc.setFontSize(FONT.h2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.textSecondary);
  doc.text(`Generated by ${reportDoc.header.subtitle}`, PAGE.marginLeft, cursor.y);
  cursor.advance(10);

  // Meta info
  const metaItems: [string, string][] = [
    ['Status', reportDoc.header.assessmentStatus],
    ['Generated', formatTimestamp(reportDoc.header.generatedAt)],
    ['Schema Version', reportDoc.header.schemaVersion],
  ];
  if (reportDoc.header.assessmentId) {
    metaItems.unshift(['Assessment ID', reportDoc.header.assessmentId]);
  }
  if (reportDoc.header.assessmentName) {
    metaItems.unshift(['Assessment Name', reportDoc.header.assessmentName]);
  }

  metaItems.forEach(([label, value]) => {
    renderLabelValue(doc, cursor, label, value);
  });
  cursor.advance(4);
}

function renderExecutiveSummary(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  const summary = reportDoc.executiveSummary;
  renderSectionHeading(doc, cursor, 'Executive Summary');

  if (summary.isIncomplete) {
    cursor.ensureSpace(12);
    // Warning box
    const boxH = 10;
    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(253, 186, 116);
    doc.setLineWidth(0.4);
    doc.roundedRect(PAGE.marginLeft, cursor.y - 3, CONTENT_WIDTH, boxH, 1.5, 1.5, 'FD');
    doc.setFontSize(FONT.small);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(154, 52, 18);
    doc.text(
      'ASSESSMENT INCOMPLETE — Do not treat this record as a final regulatory conclusion.',
      PAGE.marginLeft + 4,
      cursor.y + 2,
    );
    cursor.advance(boxH + 4);
  }

  renderLabelValue(doc, cursor, 'Pathway', summary.pathwayConclusion);
  renderLabelValue(doc, cursor, 'Confidence', summary.confidenceLevel);
  renderLabelValue(doc, cursor, 'Reliance State', `${summary.relianceState} — ${summary.relianceDetail}`);
  renderLabelValue(doc, cursor, 'Primary Action', summary.primaryNextAction);

  cursor.advance(3);
  renderSubheading(doc, cursor, 'Summary');
  renderBodyText(doc, cursor, summary.summaryStatement);
}

function renderAssessmentBasis(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  const basis = reportDoc.assessmentBasis;
  renderSectionHeading(doc, cursor, 'Assessment Basis');

  // Record facts subsection
  renderSubheading(doc, cursor, 'Record Facts');
  doc.setFontSize(FONT.label);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR.textMuted);
  doc.text('User-entered data from the assessment intake.', PAGE.marginLeft, cursor.y);
  cursor.advance(5);

  basis.recordFacts.forEach((fact) => {
    renderLabelValue(doc, cursor, fact.label, fact.value, fact.isMissing);
  });

  // System basis subsection
  if (basis.systemGeneratedBasis.length > 0) {
    cursor.advance(4);
    renderSubheading(doc, cursor, 'System-Generated Assessment Basis');
    doc.setFontSize(FONT.label);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLOR.textMuted);
    doc.text(
      'Derived by ChangePath from intake responses and determination logic.',
      PAGE.marginLeft,
      cursor.y,
    );
    cursor.advance(5);

    renderNumberedList(doc, cursor, basis.systemGeneratedBasis);
  }
}

function renderDecisionTrace(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  if (reportDoc.decisionTrace.steps.length === 0) return;

  renderSectionHeading(doc, cursor, 'Decision Trace');

  doc.setFontSize(FONT.label);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR.textMuted);
  doc.text(
    'Trace of how assessment intake responses led to the current pathway recommendation.',
    PAGE.marginLeft,
    cursor.y,
  );
  cursor.advance(5);

  renderNumberedList(doc, cursor, reportDoc.decisionTrace.steps);
}

function renderNarrative(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  const narr = reportDoc.narrative;
  const hasContent = narr.headlineReason ||
    narr.supportingPoints.length > 0 ||
    narr.verificationSteps.length > 0;
  if (!hasContent) return;

  renderSectionHeading(doc, cursor, 'Assessment Rationale');

  if (narr.headlineReason) {
    renderBodyText(doc, cursor, narr.headlineReason);
  }

  if (narr.supportingPoints.length > 0) {
    narr.supportingPoints.forEach((point) => {
      renderBodyTextSecondary(doc, cursor, point, 4);
    });
  }

  if (narr.verificationSteps.length > 0) {
    cursor.advance(2);
    renderSubheading(doc, cursor, narr.verificationTitle || 'Verification Focus');
    renderNumberedList(doc, cursor, narr.verificationSteps);
  }
}

function renderOpenIssues(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  if (reportDoc.openIssues.length === 0) return;

  renderSectionHeading(doc, cursor, 'Open Issues and Evidence Needed');

  doc.setFontSize(FONT.label);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR.textMuted);
  doc.text(
    'Items requiring resolution or additional evidence before the assessment can be relied upon.',
    PAGE.marginLeft,
    cursor.y,
  );
  cursor.advance(5);

  reportDoc.openIssues.forEach((issue: PdfOpenIssue, index: number) => {
    renderOpenIssueItem(doc, cursor, issue, index);
  });
}

function renderOpenIssueItem(
  doc: jsPDF,
  cursor: Cursor,
  issue: PdfOpenIssue,
  index: number,
): void {
  // Estimate height needed
  const titleH = textHeight(doc, issue.title, CONTENT_WIDTH - 12, FONT.body);
  const whyH = textHeight(doc, issue.whyItMatters, CONTENT_WIDTH - 12, FONT.small);
  const actionH = textHeight(doc, issue.actionNeeded, CONTENT_WIDTH - 12, FONT.small);
  const estimatedH = titleH + whyH + actionH + 16;
  cursor.ensureSpace(Math.min(estimatedH, 40));

  // Issue number and title
  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.text);
  const titleLines = splitLines(doc, `${index + 1}. ${issue.title}`, CONTENT_WIDTH);
  doc.text(titleLines, PAGE.marginLeft, cursor.y);
  cursor.advance(titleH + 1);

  // Kind tag and meta
  const kindLabel = issue.kind === 'expert-review' ? 'EXPERT REVIEW' : 'EVIDENCE GAP';
  renderTag(doc, cursor, kindLabel);
  if (issue.meta) {
    doc.setFontSize(FONT.label);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.textSecondary);
    const tagW = doc.getTextWidth(kindLabel) + 10;
    doc.text(issue.meta, PAGE.marginLeft + tagW, cursor.y);
  }
  cursor.advance(5);

  // Why it matters
  doc.setFontSize(FONT.small);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR.textSecondary);
  const whyLines = splitLines(doc, `Why it matters: ${issue.whyItMatters}`, CONTENT_WIDTH - 6);
  doc.text(whyLines, PAGE.marginLeft + 6, cursor.y);
  cursor.advance(whyH + 1);

  // Action needed
  doc.setFontSize(FONT.small);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.text);
  const actionLines = splitLines(
    doc,
    `${issue.actionLabel}: ${issue.actionNeeded}`,
    CONTENT_WIDTH - 6,
  );
  doc.text(actionLines, PAGE.marginLeft + 6, cursor.y);
  cursor.advance(actionH + 1);

  // Source refs
  if (issue.sources.length > 0) {
    doc.setFontSize(FONT.label);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.textMuted);
    const sourceLine = `Basis: ${issue.sources.join('; ')}`;
    const sourceLines = splitLines(doc, sourceLine, CONTENT_WIDTH - 6);
    cursor.ensureSpace(sourceLines.length * 3 + 2);
    doc.text(sourceLines, PAGE.marginLeft + 6, cursor.y);
    cursor.advance(sourceLines.length * 3 + 1);
  }

  cursor.advance(3);
}

function renderAlternativePathways(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  if (reportDoc.alternativePathways.length === 0) return;

  renderSectionHeading(doc, cursor, 'Alternative Pathways and Counter-Considerations');

  doc.setFontSize(FONT.label);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR.textMuted);
  doc.text(
    'Factors that could change or challenge the current pathway conclusion.',
    PAGE.marginLeft,
    cursor.y,
  );
  cursor.advance(5);

  renderNumberedList(
    doc,
    cursor,
    reportDoc.alternativePathways.map((ap) => ap.description),
  );
}

function renderSourcesCited(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  if (reportDoc.sourcesCited.length === 0) return;

  renderSectionHeading(doc, cursor, 'Sources Cited');

  doc.setFontSize(FONT.label);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR.textMuted);
  doc.text(
    'Regulatory sources referenced during this assessment. Citations indicate relevance, not statement-level attribution.',
    PAGE.marginLeft,
    cursor.y,
  );
  cursor.advance(5);

  reportDoc.sourcesCited.forEach((source: PdfSourceCitation, i: number) => {
    const text = `${i + 1}. ${source.badge}`;
    const h = textHeight(doc, text, CONTENT_WIDTH - 6, FONT.small);
    cursor.ensureSpace(h + 2);

    doc.setFontSize(FONT.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.text);
    const lines = splitLines(doc, text, CONTENT_WIDTH - 6);
    doc.text(lines, PAGE.marginLeft + 4, cursor.y);
    cursor.advance(h + 1);
  });
}

function renderReviewerNotes(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  if (reportDoc.reviewerNotes.length === 0) return;

  renderSectionHeading(doc, cursor, 'Reviewer Notes');

  doc.setFontSize(FONT.label);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR.textMuted);
  doc.text(
    'Notes entered by reviewers. These are user-provided annotations, not system-generated content.',
    PAGE.marginLeft,
    cursor.y,
  );
  cursor.advance(5);

  reportDoc.reviewerNotes.forEach((note) => {
    const noteH = textHeight(doc, note.text, CONTENT_WIDTH - 6, FONT.body);
    cursor.ensureSpace(noteH + 8);

    // Author and timestamp
    doc.setFontSize(FONT.label);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.textSecondary);
    doc.text(note.author, PAGE.marginLeft + 4, cursor.y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.textMuted);
    const authorW = doc.getTextWidth(note.author) + 4;
    doc.text(` — ${formatDateShort(note.timestamp)}`, PAGE.marginLeft + 4 + authorW, cursor.y);
    cursor.advance(4);

    // Note text
    doc.setFontSize(FONT.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.text);
    const lines = splitLines(doc, note.text, CONTENT_WIDTH - 6);
    doc.text(lines, PAGE.marginLeft + 4, cursor.y);
    cursor.advance(noteH + 4);
  });
}

function renderClosing(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  renderSectionHeading(doc, cursor, 'Record Information');

  renderLabelValue(doc, cursor, 'Generated by', reportDoc.closing.generatedBy);
  renderLabelValue(doc, cursor, 'Timestamp', formatTimestamp(reportDoc.closing.timestamp));

  cursor.advance(4);
  renderSubheading(doc, cursor, 'Disclaimer');

  // Disclaimer in a subtle box
  const disclaimerH = textHeight(doc, reportDoc.closing.disclaimer, CONTENT_WIDTH - 10, FONT.small);
  cursor.ensureSpace(disclaimerH + 8);

  doc.setFillColor(...COLOR.sectionBg);
  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(
    PAGE.marginLeft,
    cursor.y - 4,
    CONTENT_WIDTH,
    disclaimerH + 8,
    1.5,
    1.5,
    'FD',
  );

  doc.setFontSize(FONT.small);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR.textSecondary);
  const disclaimerLines = splitLines(doc, reportDoc.closing.disclaimer, CONTENT_WIDTH - 10);
  doc.text(disclaimerLines, PAGE.marginLeft + 5, cursor.y);
  cursor.advance(disclaimerH + 8);
}

/* ------------------------------------------------------------------ */
/*  Post-render: stamp page footers on all pages                       */
/* ------------------------------------------------------------------ */

function stampAllPageFooters(doc: jsPDF, reportDoc: PdfReportDocument): void {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    renderPageFooter(doc, reportDoc, i);
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function renderPdfReport(reportDoc: PdfReportDocument): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');
  const cursor = new Cursor(doc, reportDoc);

  // Page 1 header
  renderPageHeader(doc, reportDoc);

  // Title block
  renderTitlePage(doc, cursor, reportDoc);

  // Sections
  renderExecutiveSummary(doc, cursor, reportDoc);
  renderAssessmentBasis(doc, cursor, reportDoc);
  renderDecisionTrace(doc, cursor, reportDoc);
  renderNarrative(doc, cursor, reportDoc);
  renderOpenIssues(doc, cursor, reportDoc);
  renderAlternativePathways(doc, cursor, reportDoc);
  renderSourcesCited(doc, cursor, reportDoc);
  renderReviewerNotes(doc, cursor, reportDoc);
  renderClosing(doc, cursor, reportDoc);

  // Stamp footers on all pages (deferred so page count is known)
  stampAllPageFooters(doc, reportDoc);

  return doc;
}

export function generateAndDownloadPdf(reportDoc: PdfReportDocument): void {
  const doc = renderPdfReport(reportDoc);

  // Build a professional filename
  const datePart = new Date().toISOString().slice(0, 10);
  const idPart = reportDoc.header.assessmentId
    ? `-${reportDoc.header.assessmentId}`
    : '';
  const namePart = reportDoc.header.assessmentName
    ? `-${reportDoc.header.assessmentName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+$/, '').slice(0, 40)}`
    : '';
  const filename = `ChangePath-Assessment${idPart}${namePart}-${datePart}.pdf`;

  doc.save(filename);
}
