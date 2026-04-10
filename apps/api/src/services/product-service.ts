import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { createAuditEvent } from './audit-service.js';
import type { CreateProduct, UpdateProduct } from '@changepath/shared';

export async function listProducts(organizationId: string) {
  return prisma.product.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProduct(id: string, organizationId: string) {
  return prisma.product.findFirst({
    where: { id, organizationId },
  });
}

export async function createProduct(
  data: CreateProduct,
  organizationId: string,
  userId: string,
) {
  const product = await prisma.product.create({
    data: {
      organizationId,
      productName: data.productName,
      deviceFamily: data.deviceFamily ?? null,
      deviceClass: data.deviceClass,
      regulatoryPathwayBaseline: data.regulatoryPathwayBaseline,
      predicateDevice: data.predicateDevice ?? null,
      pccpStatus: data.pccpStatus,
      softwareLevelOfConcern: data.softwareLevelOfConcern,
      jurisdictionsJson: data.jurisdictionsJson
        ? (data.jurisdictionsJson as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  });

  await createAuditEvent({
    organizationId,
    entityType: 'product',
    entityId: product.id,
    action: 'create',
    afterJson: product as unknown as Prisma.InputJsonValue,
    performedByUserId: userId,
  });

  return product;
}

export async function updateProduct(
  id: string,
  data: UpdateProduct,
  organizationId: string,
  userId: string,
) {
  const existing = await prisma.product.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return null;

  const updateData: Prisma.ProductUpdateInput = {};
  if (data.productName !== undefined) updateData.productName = data.productName;
  if (data.deviceFamily !== undefined) updateData.deviceFamily = data.deviceFamily;
  if (data.deviceClass !== undefined) updateData.deviceClass = data.deviceClass;
  if (data.regulatoryPathwayBaseline !== undefined) updateData.regulatoryPathwayBaseline = data.regulatoryPathwayBaseline;
  if (data.predicateDevice !== undefined) updateData.predicateDevice = data.predicateDevice;
  if (data.pccpStatus !== undefined) updateData.pccpStatus = data.pccpStatus;
  if (data.softwareLevelOfConcern !== undefined) updateData.softwareLevelOfConcern = data.softwareLevelOfConcern;
  if (data.jurisdictionsJson !== undefined) {
    updateData.jurisdictionsJson = data.jurisdictionsJson
      ? (data.jurisdictionsJson as Prisma.InputJsonValue)
      : Prisma.JsonNull;
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
  });

  await createAuditEvent({
    organizationId,
    entityType: 'product',
    entityId: product.id,
    action: 'update',
    beforeJson: existing as unknown as Prisma.InputJsonValue,
    afterJson: product as unknown as Prisma.InputJsonValue,
    performedByUserId: userId,
  });

  return product;
}
