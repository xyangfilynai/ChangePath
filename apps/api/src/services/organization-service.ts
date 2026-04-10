import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { createAuditEvent } from './audit-service.js';
import type { UpdateOrganizationSettings } from '@changepath/shared';

const toJsonValue = (
  value: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | undefined => {
  if (value === undefined) return undefined;
  return value === null
    ? (Prisma.JsonNull as unknown as Prisma.InputJsonValue)
    : (value as Prisma.InputJsonValue);
};

export async function getOrganizationSettings(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
  });
}

export async function updateOrganizationSettings(
  organizationId: string,
  data: UpdateOrganizationSettings,
  performedByUserId: string,
) {
  const existing = await getOrganizationSettings(organizationId);
  if (!existing) {
    throw new Error('Organization not found');
  }

  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.planTier !== undefined && { planTier: data.planTier }),
      ...(data.ssoConfigJson !== undefined && {
        ssoConfigJson: toJsonValue(data.ssoConfigJson),
      }),
      ...(data.dataRetentionPolicyJson !== undefined && {
        dataRetentionPolicyJson: toJsonValue(data.dataRetentionPolicyJson),
      }),
    },
  });

  await createAuditEvent({
    organizationId,
    entityType: 'organization',
    entityId: organization.id,
    action: 'update',
    beforeJson: existing,
    afterJson: organization,
    performedByUserId,
  });

  return organization;
}
