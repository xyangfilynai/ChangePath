/**
 * PDF document renderer for regulatory assessment records.
 *
 * Converts a PdfReportDocument model into a real PDF using jsPDF.
 * Targets enterprise medical-device compliance formatting: dense, aligned,
 * professional, and suitable for inclusion in QMS-controlled documentation.
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
  marginTop: 24,
  marginBottom: 22,
  headerHeight: 12,
  footerHeight: 10,
} as const;

const CONTENT_WIDTH = PAGE.width - PAGE.marginLeft - PAGE.marginRight;
const CONTENT_TOP = PAGE.marginTop + PAGE.headerHeight;
const CONTENT_BOTTOM = PAGE.height - PAGE.marginBottom - PAGE.footerHeight;

/* ------------------------------------------------------------------ */
/*  Color palette — restrained, enterprise                             */
/* ------------------------------------------------------------------ */

const COLOR = {
  text: [33, 37, 41] as [number, number, number],
  textSecondary: [100, 108, 116] as [number, number, number],
  textMuted: [145, 152, 160] as [number, number, number],
  accent: [44, 50, 56] as [number, number, number],
  border: [200, 204, 210] as [number, number, number],
  borderLight: [220, 224, 228] as [number, number, number],
  sectionBg: [246, 248, 250] as [number, number, number],
  missingText: [175, 175, 175] as [number, number, number],
  tagBg: [232, 236, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

/* ------------------------------------------------------------------ */
/*  Font size constants — tighter scale for density                    */
/* ------------------------------------------------------------------ */

const FONT = {
  title: 15,
  h1: 11,
  h2: 9.5,
  body: 8.5,
  small: 7.8,
  tiny: 7,
  label: 6.5,
} as const;

/* ------------------------------------------------------------------ */
/*  Spacing constants — tight, enterprise-grade                        */
/* ------------------------------------------------------------------ */

const SP = {
  sectionGapBefore: 3.5,   // space before section rule (if not at top)
  sectionRuleToTitle: 4,    // rule → section title
  sectionTitleToBody: 3.5,  // section title → first content
  subheadingBefore: 2,      // space above subheading
  subheadingAfter: 2.5,     // subheading → content
  bodyAfter: 1.5,           // after body text block
  listItemAfter: 1,         // after each list item
  labelValueAfter: 0.8,     // between label-value rows
  noteAfter: 1,             // after section notes
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

  get remaining(): number {
    return CONTENT_BOTTOM - this.y;
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
  return lines.length * lh(fontSize);
}

function lh(fontSize: number): number {
  return fontSize * 0.40;
}

/**
 * Renders pre-split lines with automatic page-break handling.
 * Ensures long text is never clipped or truncated at page boundaries.
 */
function renderPaginatedLines(
  doc: jsPDF,
  cursor: Cursor,
  lines: string[],
  lineH: number,
  x: number,
): void {
  let i = 0;
  while (i < lines.length) {
    const available = cursor.remaining;
    const fitCount = Math.max(1, Math.floor(available / lineH));
    const chunk = lines.slice(i, i + fitCount);
    doc.text(chunk, x, cursor.y);
    cursor.advance(chunk.length * lineH);
    i += chunk.length;
    if (i < lines.length) {
      cursor.newPage();
    }
  }
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

  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.25);
  doc.line(PAGE.marginLeft, y + 2.5, PAGE.width - PAGE.marginRight, y + 2.5);
}

function renderPageFooter(
  doc: jsPDF,
  _reportDoc: PdfReportDocument,
  pageNum: number,
  totalPages: number,
): void {
  const y = PAGE.height - PAGE.marginBottom;

  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.25);
  doc.line(PAGE.marginLeft, y - 3, PAGE.width - PAGE.marginRight, y - 3);

  doc.setFontSize(FONT.label);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.textMuted);

  doc.text(
    'Internal assessment support record — not a regulatory determination',
    PAGE.marginLeft,
    y,
  );

  doc.text(
    `Page ${pageNum} of ${totalPages}`,
    PAGE.width - PAGE.marginRight,
    y,
    { align: 'right' },
  );
}

/* ------------------------------------------------------------------ */
/*  Section heading — compact, authoritative                           */
/* ------------------------------------------------------------------ */

function renderSectionHeading(doc: jsPDF, cursor: Cursor, title: string): void {
  cursor.ensureSpace(10);

  if (cursor.y > CONTENT_TOP + 4) {
    cursor.advance(SP.sectionGapBefore);
  }

  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.2);
  doc.line(PAGE.marginLeft, cursor.y, PAGE.width - PAGE.marginRight, cursor.y);
  cursor.advance(SP.sectionRuleToTitle);

  doc.setFontSize(FONT.h1);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.accent);
  doc.text(title, PAGE.marginLeft, cursor.y);
  cursor.advance(SP.sectionTitleToBody);
}

function renderSubheading(doc: jsPDF, cursor: Cursor, title: string): void {
  cursor.ensureSpace(8);
  cursor.advance(SP.subheadingBefore);

  doc.setFontSize(FONT.h2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.text);
  doc.text(title, PAGE.marginLeft, cursor.y);
  cursor.advance(SP.subheadingAfter);
}

/* ------------------------------------------------------------------ */
/*  Body text — paginated                                              */
/* ------------------------------------------------------------------ */

function renderBodyText(doc: jsPDF, cursor: Cursor, text: string, indent = 0): void {
  const maxW = CONTENT_WIDTH - indent;
  const lineH = lh(FONT.body);
  cursor.ensureSpace(lineH * 2 + SP.bodyAfter);

  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.text);
  const lines = splitLines(doc, text, maxW);
  renderPaginatedLines(doc, cursor, lines, lineH, PAGE.marginLeft + indent);
  cursor.advance(SP.bodyAfter);
}

function renderBodyTextSecondary(doc: jsPDF, cursor: Cursor, text: string, indent = 0): void {
  const maxW = CONTENT_WIDTH - indent;
  const lineH = lh(FONT.body);
  cursor.ensureSpace(lineH * 2 + SP.bodyAfter);

  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.textSecondary);
  const lines = splitLines(doc, text, maxW);
  renderPaginatedLines(doc, cursor, lines, lineH, PAGE.marginLeft + indent);
  cursor.advance(SP.bodyAfter);
}

/**
 * Renders a label-value pair. Automatically switches to stacked layout
 * (label on one line, value below with indent) when the label text is
 * wider than the label column, or when explicitly requested.
 */
function renderLabelValue(
  doc: jsPDF,
  cursor: Cursor,
  label: string,
  value: string,
  isMissing = false,
  options?: {
    indent?: number;
    labelWidth?: number;
    valueFontSize?: number;
    labelFontSize?: number;
    stacked?: boolean;
  },
): void {
  const indent = options?.indent ?? 0;
  const labelWidth = options?.labelWidth ?? 48;
  const valueFontSize = options?.valueFontSize ?? FONT.body;
  const labelFontSize = options?.labelFontSize ?? FONT.small;
  const valueColor: [number, number, number] = isMissing ? COLOR.missingText : COLOR.text;

  // Measure actual label width to decide inline vs stacked
  doc.setFontSize(labelFontSize);
  doc.setFont('helvetica', 'bold');
  const actualLabelWidth = doc.getTextWidth(label);
  const useStacked = options?.stacked || actualLabelWidth > labelWidth - 3;

  if (useStacked) {
    // Stacked layout: label line, then indented value below
    const labelH = lh(labelFontSize);
    const valueMaxW = CONTENT_WIDTH - indent - 4;
    const lineH = lh(valueFontSize);
    cursor.ensureSpace(labelH + lineH + SP.labelValueAfter);

    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.textSecondary);
    doc.text(label, PAGE.marginLeft + indent, cursor.y);
    cursor.advance(labelH + 0.5);

    doc.setFontSize(valueFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...valueColor);
    const lines = splitLines(doc, value, valueMaxW);
    renderPaginatedLines(doc, cursor, lines, lineH, PAGE.marginLeft + indent + 4);
    cursor.advance(SP.labelValueAfter + 0.5);
  } else {
    // Inline layout: label and value side by side
    const valueWidth = CONTENT_WIDTH - indent - labelWidth - 2;
    const lineH = lh(valueFontSize);
    doc.setFontSize(valueFontSize);
    const lines = splitLines(doc, value, valueWidth);
    const valueH = lines.length * lineH;
    const rowH = Math.max(valueH, lh(labelFontSize));
    const minH = Math.min(rowH + SP.labelValueAfter, lineH * 2 + SP.labelValueAfter);
    cursor.ensureSpace(minH);

    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.textSecondary);
    doc.text(label, PAGE.marginLeft + indent, cursor.y);

    doc.setFontSize(valueFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...valueColor);
    renderPaginatedLines(doc, cursor, lines, lineH, PAGE.marginLeft + indent + labelWidth);
    cursor.advance(SP.labelValueAfter);
  }
}

function renderSectionNote(doc: jsPDF, cursor: Cursor, text: string, indent = 0): void {
  const maxW = CONTENT_WIDTH - indent;
  const noteH = textHeight(doc, text, maxW, FONT.label);
  cursor.ensureSpace(noteH + SP.noteAfter);

  doc.setFontSize(FONT.label);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR.textMuted);
  const lines = splitLines(doc, text, maxW);
  doc.text(lines, PAGE.marginLeft + indent, cursor.y);
  cursor.advance(noteH + SP.noteAfter);
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
  const indent = options?.indent ?? 5;
  const fontSize = options?.fontSize ?? FONT.body;
  const numWidth = 7;
  const textWidth = CONTENT_WIDTH - indent - numWidth;
  const lineH = lh(fontSize);

  items.forEach((item, i) => {
    cursor.ensureSpace(lineH + SP.listItemAfter);

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.textSecondary);
    doc.text(`${i + 1}.`, PAGE.marginLeft + indent, cursor.y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.text);
    const lines = splitLines(doc, item, textWidth);
    renderPaginatedLines(doc, cursor, lines, lineH, PAGE.marginLeft + indent + numWidth);
    cursor.advance(SP.listItemAfter);
  });
}

/* ------------------------------------------------------------------ */
/*  Tag / badge                                                        */
/* ------------------------------------------------------------------ */

function renderTag(doc: jsPDF, cursor: Cursor, label: string, x?: number): number {
  const tagX = x ?? PAGE.marginLeft;
  doc.setFontSize(FONT.label);
  doc.setFont('helvetica', 'bold');
  const tagWidth = doc.getTextWidth(label) + 4;
  const tagH = 3.5;

  doc.setFillColor(...COLOR.tagBg);
  doc.roundedRect(tagX, cursor.y - 2.5, tagWidth, tagH, 0.8, 0.8, 'F');
  doc.setTextColor(...COLOR.textSecondary);
  doc.text(label, tagX + 2, cursor.y);

  return tagWidth;
}

/* ------------------------------------------------------------------ */
/*  Section renderers                                                  */
/* ------------------------------------------------------------------ */

function renderTitlePage(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  // Document kicker
  doc.setFontSize(FONT.label);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.textMuted);
  doc.text('INTERNAL ASSESSMENT SUPPORT RECORD', PAGE.marginLeft, cursor.y);
  cursor.advance(3.5);

  // Main title
  doc.setFontSize(FONT.title);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.text);
  doc.text(reportDoc.header.title, PAGE.marginLeft, cursor.y);
  cursor.advance(5);

  // Subtitle
  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.textSecondary);
  doc.text(
    `Prepared from the current assessment record in ${reportDoc.header.subtitle}.`,
    PAGE.marginLeft,
    cursor.y,
  );
  cursor.advance(5);

  // Compact metadata table — no duplicate of Record Status
  const metaItems: [string, string][] = [];
  if (reportDoc.header.assessmentName) {
    metaItems.push(['Assessment', reportDoc.header.assessmentName]);
  }
  if (reportDoc.header.assessmentId) {
    metaItems.push(['ID', reportDoc.header.assessmentId]);
  }
  metaItems.push(
    ['Pathway', reportDoc.executiveSummary.pathwayLabel],
    ['Generated', formatTimestamp(reportDoc.header.generatedAt)],
  );

  metaItems.forEach(([label, value]) => {
    renderLabelValue(doc, cursor, label, value, false, { labelWidth: 28 });
  });
  cursor.advance(2);
}

function renderExecutiveSummary(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  const summary = reportDoc.executiveSummary;
  renderSectionHeading(doc, cursor, 'Assessment Summary');

  if (summary.isIncomplete) {
    const notice =
      'Record status notice: pathway-critical items remain unresolved; do not treat the current record as a supported pathway conclusion.';
    doc.setFontSize(FONT.small);
    const noticeLines = splitLines(doc, notice, CONTENT_WIDTH - 8);
    const boxH = noticeLines.length * lh(FONT.small) + 5;
    cursor.ensureSpace(boxH + 1);
    doc.setFillColor(...COLOR.sectionBg);
    doc.setDrawColor(...COLOR.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(PAGE.marginLeft, cursor.y - 2.5, CONTENT_WIDTH, boxH, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.text);
    doc.text(noticeLines, PAGE.marginLeft + 4, cursor.y + 1);
    cursor.advance(boxH + 2);
  }

  renderLabelValue(doc, cursor, 'Record Status', summary.recordStatus);
  renderLabelValue(doc, cursor, 'Conditions for Reliance', summary.relianceQualification);
  renderLabelValue(doc, cursor, 'Recommended Next Action', summary.primaryNextAction);

  cursor.advance(1.5);
  renderSubheading(doc, cursor, 'Conclusion');
  renderBodyText(doc, cursor, summary.pathwayConclusion);

  if (summary.summaryStatement && summary.summaryStatement !== summary.pathwayConclusion) {
    renderSubheading(doc, cursor, 'Analytical Summary');
    renderSectionNote(
      doc,
      cursor,
      'System-generated summary derived from the assessment logic; review against the record facts and cited sources.',
    );
    renderBodyText(doc, cursor, summary.summaryStatement);
  }
}

function renderAssessmentBasis(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  const basis = reportDoc.assessmentBasis;
  renderSectionHeading(doc, cursor, 'Assessment Basis');

  renderSubheading(doc, cursor, 'Record Facts');
  renderSectionNote(
    doc,
    cursor,
    'Copied from the assessment record as entered. Missing fields are shown as "Not provided."',
  );

  basis.recordFacts.forEach((fact) => {
    renderLabelValue(doc, cursor, fact.label, fact.value, fact.isMissing, {
      stacked: fact.isLongText,
    });
  });

  if (basis.systemGeneratedBasis.length > 0) {
    cursor.advance(2);
    renderSubheading(doc, cursor, 'Derived Assessment Basis');
    renderSectionNote(
      doc,
      cursor,
      'Derived by ChangePath from the recorded answers and decision logic. Analytical support, not source evidence.',
    );
    renderNumberedList(doc, cursor, basis.systemGeneratedBasis);
  }
}

function renderDecisionTrace(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  if (reportDoc.decisionTrace.steps.length === 0) return;

  renderSectionHeading(doc, cursor, 'Decision Logic Trace');
  renderSectionNote(
    doc,
    cursor,
    'Ordered logic steps applied to the current record to arrive at the present pathway assessment.',
  );
  renderNumberedList(doc, cursor, reportDoc.decisionTrace.steps);
}

function renderNarrative(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  const narr = reportDoc.narrative;
  const hasContent = narr.headlineReason ||
    narr.supportingPoints.length > 0 ||
    narr.verificationSteps.length > 0;
  if (!hasContent) return;

  renderSectionHeading(doc, cursor, 'Assessment Rationale');
  renderSectionNote(
    doc,
    cursor,
    'System-generated explanatory text. Review against the record facts and cited sources before reliance.',
  );

  if (narr.headlineReason && narr.headlineReason !== reportDoc.executiveSummary.summaryStatement) {
    renderBodyText(doc, cursor, narr.headlineReason);
  }

  if (narr.supportingPoints.length > 0) {
    narr.supportingPoints.forEach((point) => {
      renderBodyTextSecondary(doc, cursor, point, 4);
    });
  }

  if (narr.verificationSteps.length > 0) {
    cursor.advance(1);
    renderSubheading(doc, cursor, narr.verificationTitle || 'Verification Focus');
    renderNumberedList(doc, cursor, narr.verificationSteps);
  }
}

function renderOpenIssues(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  if (reportDoc.openIssues.length === 0) return;

  const n = reportDoc.openIssues.length;
  renderSectionHeading(doc, cursor, 'Open Issues Requiring Resolution');
  renderSectionNote(
    doc,
    cursor,
    `${n} open item${n === 1 ? '' : 's'} that limit${n === 1 ? 's' : ''} reliance on the current pathway assessment until resolved or supplemented.`,
  );

  reportDoc.openIssues.forEach((issue: PdfOpenIssue, index: number) => {
    renderOpenIssueItem(doc, cursor, issue, index, index < reportDoc.openIssues.length - 1);
  });
}

function renderOpenIssueItem(
  doc: jsPDF,
  cursor: Cursor,
  issue: PdfOpenIssue,
  index: number,
  showDivider: boolean,
): void {
  const detailLabelWidth = 30;
  const kindLabel = issue.kind === 'expert-review' ? 'Expert Review' : 'Evidence Gap';

  // Ensure at least tag row + title + one detail line fit together
  cursor.ensureSpace(lh(FONT.body) * 3 + 8);

  // Tags: issue number + kind
  const tagW = renderTag(doc, cursor, `Issue ${index + 1}`);
  renderTag(doc, cursor, kindLabel, PAGE.marginLeft + tagW + 2);
  cursor.advance(4);

  // Issue title
  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.text);
  const titleLines = splitLines(doc, issue.title, CONTENT_WIDTH - 4);
  renderPaginatedLines(doc, cursor, titleLines, lh(FONT.body), PAGE.marginLeft + 4);
  cursor.advance(1.5);

  const detailOpts = {
    indent: 4,
    labelWidth: detailLabelWidth,
    valueFontSize: FONT.small as number,
    labelFontSize: FONT.label as number,
  };

  if (issue.meta) {
    renderLabelValue(doc, cursor, 'Context', issue.meta, false, detailOpts);
  }
  renderLabelValue(doc, cursor, 'Record Impact', issue.whyItMatters, false, detailOpts);
  renderLabelValue(doc, cursor, 'Required Action', `${issue.actionLabel}: ${issue.actionNeeded}`, false, detailOpts);

  if (issue.sources.length > 0) {
    renderLabelValue(doc, cursor, 'Basis Referenced', issue.sources.join('; '), false, detailOpts);
  }

  if (showDivider) {
    cursor.advance(1.5);
    doc.setDrawColor(...COLOR.borderLight);
    doc.setLineWidth(0.15);
    doc.line(PAGE.marginLeft + 4, cursor.y, PAGE.marginLeft + CONTENT_WIDTH - 4, cursor.y);
    cursor.advance(2.5);
  } else {
    cursor.advance(1.5);
  }
}

function renderAlternativePathways(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  if (reportDoc.alternativePathways.length === 0) return;

  renderSectionHeading(doc, cursor, 'Conditions That Could Affect the Pathway');
  renderSectionNote(
    doc,
    cursor,
    'Conditions identified by the assessment logic that could change, qualify, or overturn the current pathway assessment.',
  );
  renderNumberedList(
    doc,
    cursor,
    reportDoc.alternativePathways.map((ap) => ap.description),
  );
}

function renderSourcesCited(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  if (reportDoc.sourcesCited.length === 0) return;

  renderSectionHeading(doc, cursor, 'Sources Cited');
  renderSectionNote(
    doc,
    cursor,
    'Regulatory and standards references surfaced by the assessment logic. Citations indicate relevance, not statement-level attribution.',
  );

  const numWidth = 7;
  const textWidth = CONTENT_WIDTH - numWidth - 4;
  const lineH = lh(FONT.small);

  reportDoc.sourcesCited.forEach((source: PdfSourceCitation, i: number) => {
    cursor.ensureSpace(lineH + 1);

    doc.setFontSize(FONT.small);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.textSecondary);
    doc.text(`${i + 1}.`, PAGE.marginLeft + 4, cursor.y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.text);
    const lines = splitLines(doc, source.badge, textWidth);
    renderPaginatedLines(doc, cursor, lines, lineH, PAGE.marginLeft + 4 + numWidth);
    cursor.advance(1);
  });
}

function renderReviewerNotes(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  if (reportDoc.reviewerNotes.length === 0) return;

  renderSectionHeading(doc, cursor, 'Reviewer Notes');
  renderSectionNote(
    doc,
    cursor,
    'User-entered annotations attached to this assessment. Not system-generated content.',
  );

  const lineH = lh(FONT.body);
  reportDoc.reviewerNotes.forEach((note) => {
    cursor.ensureSpace(lineH * 2 + 5);

    doc.setFontSize(FONT.label);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.textSecondary);
    doc.text(note.author, PAGE.marginLeft + 4, cursor.y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.textMuted);
    const authorW = doc.getTextWidth(note.author) + 4;
    doc.text(` — ${formatDateShort(note.timestamp)}`, PAGE.marginLeft + 4 + authorW, cursor.y);
    cursor.advance(3);

    doc.setFontSize(FONT.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.text);
    const lines = splitLines(doc, note.text, CONTENT_WIDTH - 6);
    renderPaginatedLines(doc, cursor, lines, lineH, PAGE.marginLeft + 4);
    cursor.advance(3);
  });
}

function renderClosing(doc: jsPDF, cursor: Cursor, reportDoc: PdfReportDocument): void {
  // Estimate how much space the closing block needs
  const disclaimerH = textHeight(doc, reportDoc.closing.disclaimer, CONTENT_WIDTH - 8, FONT.small);
  const metaH = 4 * (lh(FONT.body) + SP.labelValueAfter + 1); // 4 rows of metadata
  const headingH = 10;
  const estimatedTotal = headingH + metaH + 3 + disclaimerH + 6;

  // Only jump to a new page if we genuinely can't fit and we're past the halfway mark
  if (cursor.remaining < estimatedTotal && cursor.remaining < (CONTENT_BOTTOM - CONTENT_TOP) * 0.5) {
    cursor.newPage();
  }

  renderSectionHeading(doc, cursor, 'Document Control');

  renderLabelValue(doc, cursor, 'Source', `Assessment record in ${reportDoc.closing.generatedBy}`, false, { labelWidth: 34 });
  renderLabelValue(doc, cursor, 'Generated', formatTimestamp(reportDoc.closing.timestamp), false, { labelWidth: 34 });
  renderLabelValue(doc, cursor, 'Logic Version', reportDoc.closing.schemaVersion, false, { labelWidth: 34 });
  renderLabelValue(doc, cursor, 'Export Format', reportDoc.closing.exportVersion, false, { labelWidth: 34 });

  // Disclaimer — inline without a separate heading to avoid orphaning
  cursor.advance(2.5);
  const boxH = disclaimerH + 5;
  cursor.ensureSpace(boxH);

  doc.setFillColor(...COLOR.sectionBg);
  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(PAGE.marginLeft, cursor.y - 3, CONTENT_WIDTH, boxH, 1, 1, 'FD');

  doc.setFontSize(FONT.small);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR.textSecondary);
  const disclaimerLines = splitLines(doc, reportDoc.closing.disclaimer, CONTENT_WIDTH - 8);
  doc.text(disclaimerLines, PAGE.marginLeft + 4, cursor.y);
  cursor.advance(boxH);
}

/* ------------------------------------------------------------------ */
/*  Post-render: stamp page footers on all pages                       */
/* ------------------------------------------------------------------ */

function stampAllPageFooters(doc: jsPDF, reportDoc: PdfReportDocument): void {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    renderPageFooter(doc, reportDoc, i, totalPages);
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function renderPdfReport(reportDoc: PdfReportDocument): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');
  const cursor = new Cursor(doc, reportDoc);

  renderPageHeader(doc, reportDoc);
  renderTitlePage(doc, cursor, reportDoc);
  renderExecutiveSummary(doc, cursor, reportDoc);
  renderAssessmentBasis(doc, cursor, reportDoc);
  renderDecisionTrace(doc, cursor, reportDoc);
  renderNarrative(doc, cursor, reportDoc);
  renderOpenIssues(doc, cursor, reportDoc);
  renderAlternativePathways(doc, cursor, reportDoc);
  renderSourcesCited(doc, cursor, reportDoc);
  renderReviewerNotes(doc, cursor, reportDoc);
  renderClosing(doc, cursor, reportDoc);

  stampAllPageFooters(doc, reportDoc);

  return doc;
}

export function generateAndDownloadPdf(reportDoc: PdfReportDocument): void {
  const doc = renderPdfReport(reportDoc);

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
