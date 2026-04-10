import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import {
  LoginRequestSchema,
  LogoutResponseSchema,
  RefreshSessionResponseSchema,
} from '@changepath/shared';
import {
  extractBearerToken,
  issueSessionToken,
  loadAuthenticatedContext,
  verifyDevPassword,
  verifySessionToken,
} from '../services/session-service.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/login', async (request, reply) => {
    const parsed = LoginRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    if (!verifyDevPassword(parsed.data.password)) {
      reply.code(401).send({ error: 'Invalid credentials' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        email: parsed.data.email,
        status: 'active',
      },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!user) {
      reply.code(401).send({ error: 'Invalid credentials' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const session = issueSessionToken(user.id);

    return {
      user,
      organization: user.organization,
      session,
    };
  });

  app.post('/api/auth/refresh', async (request, reply) => {
    const sessionPayload = verifySessionToken(
      extractBearerToken(request.headers.authorization),
    );
    if (!sessionPayload) {
      reply.code(401).send({ error: 'Invalid or expired session' });
      return;
    }

    const context = await loadAuthenticatedContext(sessionPayload.sub);
    if (!context) {
      reply.code(401).send({ error: 'User not found or inactive' });
      return;
    }

    const session = issueSessionToken(context.user.id);
    const response = RefreshSessionResponseSchema.parse({ session });
    return response;
  });

  app.post('/api/auth/logout', async () => {
    return LogoutResponseSchema.parse({ ok: true });
  });

  app.get('/api/auth/session', async (request) => {
    return {
      user: request.currentUser,
      organization: request.organization,
      session: request.sessionExpiresAt
        ? {
            token: 'redacted',
            expiresAt: request.sessionExpiresAt,
          }
        : null,
    };
  });

  /** Backward-compatible alias retained while the web client migrates. */
  app.get('/api/me', async (request) => {
    return {
      user: request.currentUser,
      organization: request.organization,
    };
  });
}
