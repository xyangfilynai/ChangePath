import { FastifyInstance } from 'fastify';
import { CreateProductSchema, UpdateProductSchema } from '@changepath/shared';
import { requireRole } from '../plugins/auth.js';
import * as productService from '../services/product-service.js';

export async function productRoutes(app: FastifyInstance) {
  app.get('/api/products', async (request) => {
    return productService.listProducts(request.organization.id);
  });

  app.get<{ Params: { id: string } }>('/api/products/:id', async (request, reply) => {
    const product = await productService.getProduct(
      request.params.id,
      request.organization.id,
    );
    if (!product) {
      reply.code(404).send({ error: 'Product not found' });
      return;
    }
    return product;
  });

  app.post('/api/products', async (request, reply) => {
    if (!(await requireRole(request, reply, ['org_admin']))) return;
    const parsed = CreateProductSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const product = await productService.createProduct(
      parsed.data,
      request.organization.id,
      request.currentUser.id,
    );
    reply.code(201).send(product);
  });

  app.patch<{ Params: { id: string } }>('/api/products/:id', async (request, reply) => {
    if (!(await requireRole(request, reply, ['org_admin']))) return;
    const parsed = UpdateProductSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const product = await productService.updateProduct(
      request.params.id,
      parsed.data,
      request.organization.id,
      request.currentUser.id,
    );
    if (!product) {
      reply.code(404).send({ error: 'Product not found' });
      return;
    }
    return product;
  });
}
