import { describe, expect, it } from 'vitest';
import { formatAuditPayload, getAuditDetailRows } from '../src/enterprise/components/case-history-format';

const BASE_EVENT = {
  id: '00000000-0000-4000-a000-000000000090',
  organizationId: '00000000-0000-4000-a000-000000000001',
  caseId: '00000000-0000-4000-a000-000000000030',
  entityId: '00000000-0000-4000-a000-000000000040',
  performedByUserId: '00000000-0000-4000-a000-000000000010',
  performedAt: new Date('2026-04-10T15:00:00.000Z'),
  ipAddress: null,
  performedBy: {
    id: '00000000-0000-4000-a000-000000000010',
    name: 'Alice Admin',
    email: 'alice@acmemedtech.com',
  },
};

describe('case history formatting', () => {
  it('summarizes assessment save details with changed fields and pathway', () => {
    const rows = getAuditDetailRows({
      ...BASE_EVENT,
      entityType: 'assessment_response_set',
      action: 'update',
      reason: '2 answer fields changed',
      beforeJson: {
        pathway: 'Assessment Incomplete',
        answerCount: 18,
        changedFieldIds: ['A2', 'B3'],
        completenessStatusJson: { overallComplete: false },
      },
      afterJson: {
        pathway: 'Letter to File',
        answerCount: 20,
        changedFieldIds: ['A2', 'B3'],
        completenessStatusJson: { overallComplete: true },
      },
    });

    expect(rows).toEqual(
      expect.arrayContaining([
        { label: 'Pathway', before: 'Assessment Incomplete', after: 'Letter to File' },
        { label: 'Changed fields', after: 'A2, B3' },
        { label: 'Answered fields', before: '18', after: '20' },
        { label: 'Completeness', before: 'In progress', after: 'Complete' },
      ]),
    );
  });

  it('reconstructs changed answers for legacy assessment audit events', () => {
    const rows = getAuditDetailRows({
      ...BASE_EVENT,
      entityType: 'assessment_response_set',
      action: 'update',
      reason: null,
      beforeJson: {
        answersJson: {
          A1: '510(k)',
          B3: 'No',
          E1: 'Yes',
        },
      },
      afterJson: {
        answersJson: {
          A1: 'PMA',
          B3: 'No',
          E1: 'Uncertain',
        },
      },
    });

    expect(rows).toEqual(
      expect.arrayContaining([
        { label: 'A1', before: '510(k)', after: 'PMA' },
        { label: 'E1', before: 'Yes', after: 'Uncertain' },
      ]),
    );
  });

  it('summarizes case field changes', () => {
    const rows = getAuditDetailRows({
      ...BASE_EVENT,
      entityType: 'change_case',
      action: 'update',
      reason: null,
      beforeJson: {
        title: 'Old title',
        status: 'draft',
        priority: 'medium',
      },
      afterJson: {
        title: 'New title',
        status: 'approval_pending',
        priority: 'high',
      },
    });

    expect(rows).toEqual(
      expect.arrayContaining([
        { label: 'Title', before: 'Old title', after: 'New title' },
        { label: 'Status', before: 'draft', after: 'approval_pending' },
        { label: 'Priority', before: 'medium', after: 'high' },
      ]),
    );
  });

  it('formats a raw payload snapshot', () => {
    const payload = formatAuditPayload({
      ...BASE_EVENT,
      entityType: 'assessment_reconciliation',
      action: 'discrepancy_detected',
      reason: 'Client provisional result differed from server authoritative execution',
      beforeJson: { clientPathway: 'Assessment Incomplete' },
      afterJson: { pathway: 'Letter to File', changedFieldIds: ['A2'] },
    });

    expect(payload).toContain('"entityType": "assessment_reconciliation"');
    expect(payload).toContain('"clientPathway": "Assessment Incomplete"');
    expect(payload).toContain('"changedFieldIds"');
  });
});
