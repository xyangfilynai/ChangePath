import { FastifyInstance } from 'fastify';
import { CreateUserSchema, UpdateUserSchema } from '@changepath/shared';
import { requireRole } from '../plugins/auth.js';
import * as userService from '../services/user-service.js';

export async function userRoutes(app: FastifyInstance) {
  app.get('/api/users', async (request) => {
    return userService.listUsers(request.organization.id);
  });

  app.post('/api/users', async (request, reply) => {
    if (!(await requireRole(request, reply, ['org_admin']))) return;
    const parsed = CreateUserSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    try {
      const user = await userService.createUser(
        parsed.data,
        request.organization.id,
        request.currentUser.id,
      );
      reply.code(201).send(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      reply.code(400).send({ error: message });
    }
  });

  app.patch<{ Params: { id: string } }>('/api/users/:id', async (request, reply) => {
    if (!(await requireRole(request, reply, ['org_admin']))) return;
    const parsed = UpdateUserSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    try {
      const user = await userService.updateUser(
        request.params.id,
        parsed.data,
        request.organization.id,
        request.currentUser.id,
      );
      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      reply.code(400).send({ error: message });
    }
  });
}
