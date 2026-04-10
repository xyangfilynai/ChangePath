import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    product: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from '../src/lib/prisma';
import { buildApp } from '../src/index';

const ORG_ID = '00000000-0000-4000-a000-000000000001';
const ADMIN_ID = '00000000-0000-4000-a000-000000000010';
const MEMBER_ID = '00000000-0000-4000-a000-000000000011';

const organization = {
  id: ORG_ID,
  name: 'Acme MedTech',
  planTier: 'enterprise',
  ssoConfigJson: null,
  dataRetentionPolicyJson: null,
  createdAt: new Date('2026-04-10T00:00:00Z'),
};

const adminUser = {
  id: ADMIN_ID,
  organizationId: ORG_ID,
  name: 'Alice Admin',
  email: 'alice@acmemedtech.com',
  title: 'VP RA',
  department: 'Regulatory',
  roleType: 'org_admin',
  status: 'active',
  lastLoginAt: null,
  createdAt: new Date('2026-04-10T00:00:00Z'),
  organization,
};

const memberUser = {
  ...adminUser,
  id: MEMBER_ID,
  name: 'Bob Builder',
  email: 'bob@acmemedtech.com',
  roleType: 'member',
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DEV_AUTH_PASSWORD = 'changepath-demo';
});

afterEach(() => {
  delete process.env.DEV_AUTH_PASSWORD;
});

describe('auth routes', () => {
  it('issues a dev session token on login', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(adminUser as never);
    vi.mocked(prisma.user.update).mockResolvedValue(adminUser as never);

    const app = await buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'alice@acmemedtech.com',
        password: 'changepath-demo',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().session.token).toEqual(expect.any(String));
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: ADMIN_ID },
      data: { lastLoginAt: expect.any(Date) },
    });

    await app.close();
  });

  it('blocks member users from org-admin product creation', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(memberUser as never);

    const app = await buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: {
        'x-user-id': MEMBER_ID,
      },
      payload: {
        productName: 'New Device',
        deviceClass: 'II',
        regulatoryPathwayBaseline: '510k',
        pccpStatus: 'none',
        softwareLevelOfConcern: 'moderate',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(prisma.product.create).not.toHaveBeenCalled();

    await app.close();
  });

  it('allows org admins to list users in their org', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(adminUser as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([adminUser, memberUser] as never);

    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: {
        'x-user-id': ADMIN_ID,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(2);

    await app.close();
  });
});
