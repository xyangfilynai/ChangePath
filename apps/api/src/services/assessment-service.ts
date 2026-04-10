import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { createAuditEvent } from './audit-service.js';
import { executeEngine } from './engine-executor.js';

export { executeEngine } from './engine-executor.js';

const SCHEMA_VERSION = '1.0.0';

/** Helper to cast values for Prisma JSON columns. */
const toJsonValue = (value: unknown): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;

export async function getAssessment(caseId: string, organizationId: string) {
  // Verify case belongs to org
  const changeCase = await prisma.changeCase.findFirst({
    where: { id: caseId, organizationId },
  });
  if (!changeCase) return null;

  return prisma.assessmentResponseSet.findFirst({
    where: { caseId },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function saveAssessment(
  caseId: string,
  answersJson: Record<string, unknown>,
  organizationId: string,
  userId: string,
) {
  // Verify case belongs to org
  const changeCase = await prisma.changeCase.findFirst({
    where: { id: caseId, organizationId },
  });
  if (!changeCase) {
    throw new Error('Case not found in organization');
  }

  // Get current assessment for audit before/after
  const existingAssessment = await prisma.assessmentResponseSet.findFirst({
    where: { caseId },
    orderBy: { updatedAt: 'desc' },
  });

  // Run authoritative engine execution
  const { derivedState, determination, completenessStatus } =
    executeEngine(answersJson);

  // Upsert assessment
  const assessment = existingAssessment
    ? await prisma.assessmentResponseSet.update({
        where: { id: existingAssessment.id },
        data: {
          answersJson: toJsonValue(answersJson),
          derivedStateJson: toJsonValue(derivedState),
          engineOutputJson: toJsonValue(determination),
          completenessStatusJson: toJsonValue(completenessStatus),
          updatedByUserId: userId,
        },
      })
    : await prisma.assessmentResponseSet.create({
        data: {
          caseId,
          schemaVersion: SCHEMA_VERSION,
          answersJson: toJsonValue(answersJson),
          derivedStateJson: toJsonValue(derivedState),
          engineOutputJson: toJsonValue(determination),
          completenessStatusJson: toJsonValue(completenessStatus),
          updatedByUserId: userId,
        },
      });

  // Update case currentDecision
  await prisma.changeCase.update({
    where: { id: caseId },
    data: {
      currentDecision: determination.pathway,
      currentVersion: { increment: 1 },
    },
  });

  // Write audit event with before/after
  await createAuditEvent({
    organizationId,
    caseId,
    entityType: 'assessment_response_set',
    entityId: assessment.id,
    action: existingAssessment ? 'update' : 'create',
    beforeJson: existingAssessment
      ? { answersJson: existingAssessment.answersJson as Prisma.InputJsonValue }
      : null,
    afterJson: { answersJson: toJsonValue(answersJson) },
    performedByUserId: userId,
  });

  return assessment;
}
