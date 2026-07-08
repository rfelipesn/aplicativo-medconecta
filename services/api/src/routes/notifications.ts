import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NOTIFICATION_TYPES } from '@medconecta/shared';

const dispatchInputSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(NOTIFICATION_TYPES),
  title: z.string(),
  body: z.string(),
});

/**
 * Disparo de notificações push/email (gratuitas). NUNCA expor diagnóstico
 * no título/corpo (privacidade na tela de bloqueio). SMS só se necessário no futuro.
 */
export async function registerNotificationRoutes(app: FastifyInstance) {
  app.post('/notifications/dispatch', async (request, reply) => {
    const parsed = dispatchInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    // TODO (Fase 2): enfileirar push (Expo/FCM) + email; persistir em `notifications`.
    return { ok: true, queued: true };
  });
}
