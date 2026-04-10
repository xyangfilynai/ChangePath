import { FastifyInstance } from 'fastify';
import { UpdateOrganizationSettingsSchema } from '@changepath/shared';
import { requireRole } from '../plugins/auth.js';
import * as organizationService from '../services/organization-service.js';

export async function adminRoutes(app: FastifyInstance) {
  app.get('/api/admin/settings', async (request, reply) => {
    if (!(await requireRole(request, reply, ['org_admin']))) return;
    return organizationService.getOrganizationSettings(request.organization.id);
  });

  app.patch('/api/admin/settings', async (request, reply) => {
    if (!(await requireRole(request, reply, ['org_admin']))) return;
    const parsed = UpdateOrganizationSettingsSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    try {
      return await organizationService.updateOrganizationSettings(
        request.organization.id,
        parsed.data,
        request.currentUser.id,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      reply.code(400).send({ error: message });
    }
  });
}
