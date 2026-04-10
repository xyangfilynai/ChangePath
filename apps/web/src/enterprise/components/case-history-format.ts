import type { AuditEvent } from '@changepath/shared';

type HistoryEvent = AuditEvent & {
  performedBy: { id: string; name: string; email: string };
};

export interface AuditDetailRow {
  label: string;
  before?: string | null;
  after?: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  discrepancy_detected: 'Detected discrepancy',
};

const ENTITY_LABELS: Record<string, string> = {
  change_case: 'case',
  assessment_response_set: 'assessment',
  assessment_reconciliation: 'reconciliation event',
  product: 'product',
  user: 'user',
  organization: 'organization',
};

const CASE_FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  status: 'Status',
  priority: 'Priority',
  changeType: 'Change type',
  currentDecision: 'Decision',
  dueDate: 'Due date',
  caseNumber: 'Case number',
  productName: 'Product',
  ownerName: 'Owner',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toFriendlyLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function looksLikeIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

function formatPrimitive(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') {
    if (looksLikeIsoDate(value)) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => formatPrimitive(item)).join(', ') : '—';
  }
  if (isRecord(value)) {
    if (typeof value.name === 'string') return value.name;
    return JSON.stringify(value);
  }
  return String(value);
}

function formatCompleteness(value: unknown): string | null {
  if (!isRecord(value)) return null;
  if (typeof value.overallComplete === 'boolean') {
    return value.overallComplete ? 'Complete' : 'In progress';
  }
  return null;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function readAnswers(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  return isRecord(value.answersJson) ? value.answersJson : null;
}

function buildAnswerDiffRows(
  beforeAnswers: Record<string, unknown> | null,
  afterAnswers: Record<string, unknown> | null,
): AuditDetailRow[] {
  if (!beforeAnswers || !afterAnswers) return [];

  const changedKeys = Array.from(new Set([...Object.keys(beforeAnswers), ...Object.keys(afterAnswers)]))
    .filter((key) => stableStringify(beforeAnswers[key]) !== stableStringify(afterAnswers[key]))
    .sort();

  const visibleKeys = changedKeys.slice(0, 6);
  const rows: AuditDetailRow[] = visibleKeys.map((key) => ({
    label: key,
    before: formatPrimitive(beforeAnswers[key]),
    after: formatPrimitive(afterAnswers[key]),
  }));

  if (changedKeys.length > visibleKeys.length) {
    rows.push({
      label: 'Additional changes',
      after: `${changedKeys.length - visibleKeys.length} more field${changedKeys.length - visibleKeys.length === 1 ? '' : 's'}`,
    });
  }

  return rows;
}

function pickCaseSnapshot(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  return {
    caseNumber: value.caseNumber,
    title: value.title,
    status: value.status,
    priority: value.priority,
    changeType: value.changeType,
    currentDecision: value.currentDecision,
    dueDate: value.dueDate,
    productName: isRecord(value.product) ? value.product.productName : value.productName,
    ownerName: isRecord(value.caseOwner) ? value.caseOwner.name : value.ownerName,
  };
}

function diffRows(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  labelMap: Record<string, string>,
): AuditDetailRow[] {
  const keys = Object.keys(labelMap);
  const rows: AuditDetailRow[] = [];

  for (const key of keys) {
    const beforeValue = before?.[key];
    const afterValue = after?.[key];
    const beforeFormatted = formatPrimitive(beforeValue);
    const afterFormatted = formatPrimitive(afterValue);

    if (before === null || before === undefined) {
      if (afterValue !== undefined && afterFormatted !== '—') {
        rows.push({ label: labelMap[key], after: afterFormatted });
      }
      continue;
    }

    if (beforeFormatted !== afterFormatted) {
      rows.push({
        label: labelMap[key],
        before: beforeFormatted,
        after: afterFormatted,
      });
    }
  }

  return rows;
}

function assessmentRows(event: HistoryEvent): AuditDetailRow[] {
  const before = isRecord(event.beforeJson) ? event.beforeJson : null;
  const after = isRecord(event.afterJson) ? event.afterJson : null;
  const beforeAnswers = readAnswers(before);
  const afterAnswers = readAnswers(after);

  const rows: AuditDetailRow[] = [];
  const beforePathway = before ? formatPrimitive(before.pathway) : null;
  const afterPathway = after ? formatPrimitive(after.pathway) : null;
  if (afterPathway && afterPathway !== '—' && beforePathway !== afterPathway) {
    rows.push({ label: 'Pathway', before: beforePathway, after: afterPathway });
  }

  const changedFieldIds = Array.isArray(after?.changedFieldIds)
    ? after.changedFieldIds.filter((value): value is string => typeof value === 'string')
    : [];
  const answerDiffRows = buildAnswerDiffRows(beforeAnswers, afterAnswers);
  if (answerDiffRows.length > 0) {
    rows.push(...answerDiffRows);
  } else if (changedFieldIds.length > 0) {
    rows.push({ label: 'Changed fields', after: changedFieldIds.join(', ') });
  }

  const beforeAnswerCount = before && typeof before.answerCount === 'number' ? String(before.answerCount) : null;
  const afterAnswerCount = after && typeof after.answerCount === 'number' ? String(after.answerCount) : null;
  if (afterAnswerCount && beforeAnswerCount !== afterAnswerCount) {
    rows.push({
      label: 'Answered fields',
      before: beforeAnswerCount,
      after: afterAnswerCount,
    });
  }

  const beforeCompleteness = before ? formatCompleteness(before.completenessStatusJson) : null;
  const afterCompleteness = after ? formatCompleteness(after.completenessStatusJson) : null;
  if (afterCompleteness && beforeCompleteness !== afterCompleteness) {
    rows.push({
      label: 'Completeness',
      before: beforeCompleteness,
      after: afterCompleteness,
    });
  }

  if (rows.length === 0 && afterAnswers) {
    rows.push({
      label: 'Captured answers',
      after: `${Object.keys(afterAnswers).length} fields`,
    });
  }

  return rows;
}

function reconciliationRows(event: HistoryEvent): AuditDetailRow[] {
  const before = isRecord(event.beforeJson) ? event.beforeJson : null;
  const after = isRecord(event.afterJson) ? event.afterJson : null;

  const rows: AuditDetailRow[] = [];
  const clientPathway = before ? formatPrimitive(before.clientPathway ?? before.clientEngineOutputJson) : null;
  const serverPathway = after ? formatPrimitive(after.serverPathway ?? after.serverEngineOutputJson) : null;

  if (clientPathway && clientPathway !== '—') {
    rows.push({ label: 'Client result', after: clientPathway });
  }
  if (serverPathway && serverPathway !== '—') {
    rows.push({ label: 'Server result', after: serverPathway });
  }

  const changedFieldIds = Array.isArray(after?.changedFieldIds)
    ? after.changedFieldIds.filter((value): value is string => typeof value === 'string')
    : [];
  if (changedFieldIds.length > 0) {
    rows.push({ label: 'Changed fields', after: changedFieldIds.join(', ') });
  }

  return rows;
}

export function getAuditActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? toFriendlyLabel(action);
}

export function getAuditEntityLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? toFriendlyLabel(entityType);
}

export function getAuditDetailRows(event: HistoryEvent): AuditDetailRow[] {
  if (event.entityType === 'assessment_response_set') {
    return assessmentRows(event);
  }

  if (event.entityType === 'assessment_reconciliation') {
    return reconciliationRows(event);
  }

  if (event.entityType === 'change_case') {
    return diffRows(pickCaseSnapshot(event.beforeJson), pickCaseSnapshot(event.afterJson), CASE_FIELD_LABELS);
  }

  if (isRecord(event.beforeJson) || isRecord(event.afterJson)) {
    return diffRows(
      isRecord(event.beforeJson) ? event.beforeJson : null,
      isRecord(event.afterJson) ? event.afterJson : null,
      Object.fromEntries(
        Array.from(
          new Set([
            ...Object.keys(isRecord(event.beforeJson) ? event.beforeJson : {}),
            ...Object.keys(isRecord(event.afterJson) ? event.afterJson : {}),
          ]),
        ).map((key) => [key, toFriendlyLabel(key)]),
      ),
    );
  }

  return [];
}

export function formatAuditPayload(event: HistoryEvent): string {
  return JSON.stringify(
    {
      before: event.beforeJson,
      after: event.afterJson,
      reason: event.reason,
      action: event.action,
      entityType: event.entityType,
    },
    null,
    2,
  );
}
