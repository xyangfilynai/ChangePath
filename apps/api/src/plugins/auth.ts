import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  extractBearerToken,
  loadAuthenticatedContext,
  verifySessionToken,
} from '../services/session-service.js';

/**
 * Development auth plugin.
 *
 * Primary auth path: signed bearer token returned by `/api/auth/login`.
 * Legacy dev/test fallback: `x-user-id` header.
 *
 * This keeps local development lightweight while preserving the request shape
 * expected by later SSO-backed implementations.
 */

declare module 'fastify' {
  interface FastifyRequest {
    currentUser: {
      id: string;
      organizationId: string;
      name: string;
      email: string;
      title: string | null;
      department: string | null;
      roleType: string;
      status: string;
      lastLoginAt: Date | null;
      createdAt: Date;
    };
    organization: {
      id: string;
      name: string;
      planTier: string;
      ssoConfigJson: unknown;
      dataRetentionPolicyJson: unknown;
      createdAt: Date;
    };
    sessionExpiresAt: Date | null;
  }
}

export async function authPlugin(app: FastifyInstance) {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const url = request.raw.url ?? '';
    if (
      url.startsWith('/api/health') ||
      url.startsWith('/api/auth/login') ||
      url.startsWith('/api/auth/refresh')
    ) {
      return;
    }

    request.sessionExpiresAt = null;

    const session = verifySessionToken(
      extractBearerToken(request.headers.authorization),
    );
    const userId = session?.sub ?? (request.headers['x-user-id'] as string | undefined);

    if (!userId) {
      reply.code(401).send({ error: 'Authentication required' });
      return;
    }

    const context = await loadAuthenticatedContext(userId);
    if (!context) {
      reply.code(401).send({ error: 'User not found or inactive' });
      return;
    }

    request.currentUser = context.user;
    request.organization = context.organization;
    request.sessionExpiresAt = session ? new Date(session.exp) : null;
  });
}

export async function requireRole(
  request: FastifyRequest,
  reply: FastifyReply,
  allowedRoles: string[],
): Promise<boolean> {
  if (allowedRoles.includes(request.currentUser.roleType)) {
    return true;
  }

  reply.code(403).send({
    error: `Requires one of: ${allowedRoles.join(', ')}`,
  });
  return false;
}
