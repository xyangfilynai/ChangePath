import { prisma } from '../lib/prisma.js';
import { createAuditEvent } from './audit-service.js';
import type { CreateUser, UpdateUser } from '@changepath/shared';

export async function listUsers(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getUser(id: string, organizationId: string) {
  return prisma.user.findFirst({
    where: { id, organizationId },
  });
}

export async function createUser(
  data: CreateUser,
  organizationId: string,
  performedByUserId: string,
) {
  const user = await prisma.user.create({
    data: {
      organizationId,
      name: data.name,
      email: data.email,
      title: data.title ?? null,
      department: data.department ?? null,
      roleType: data.roleType,
      status: data.status,
    },
  });

  await createAuditEvent({
    organizationId,
    entityType: 'user',
    entityId: user.id,
    action: 'create',
    afterJson: user,
    performedByUserId,
  });

  return user;
}

export async function updateUser(
  id: string,
  data: UpdateUser,
  organizationId: string,
  performedByUserId: string,
) {
  const existing = await getUser(id, organizationId);
  if (!existing) return null;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.department !== undefined && { department: data.department }),
      ...(data.roleType !== undefined && { roleType: data.roleType }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  await createAuditEvent({
    organizationId,
    entityType: 'user',
    entityId: user.id,
    action: 'update',
    beforeJson: existing,
    afterJson: user,
    performedByUserId,
  });

  return user;
}
