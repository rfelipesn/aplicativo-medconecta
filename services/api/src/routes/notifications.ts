import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NOTIFICATION_TYPES } from '@medconecta/shared';
import { prisma } from '@medconecta/db';
import { authenticate } from '../middleware/auth.js';

const dispatchInputSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(NOTIFICATION_TYPES),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  relatedDemandId: z.string().uuid().optional(),
});

/**
 * Notificações in-app (persistidas no banco).
 * INVARIANTE: nunca expor diagnóstico no título/corpo (privacidade na tela de bloqueio).
 * Push/e-mail (Fase 2): o mesmo dispatch persiste E enfileira envio externo.
 */
export async function registerNotificationRoutes(app: FastifyInstance) {
  // Listar notificações do usuário logado (as não lidas primeiro).
  app.get('/notifications', { preHandler: authenticate }, async (request) => {
    const userId = request.authUser!.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });
    const unreadCount = notifications.filter((n) => !n.readAt).length;
    return { notifications, unreadCount };
  });

  // Marcar uma notificação como lida.
  app.patch<{ Params: { id: string } }>(
    '/notifications/:id/read',
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.authUser!.id;
      const notif = await prisma.notification.findUnique({ where: { id: request.params.id } });
      if (!notif || notif.userId !== userId) return reply.code(404).send({ error: 'not_found' });
      if (notif.readAt) return { ok: true, alreadyRead: true };

      const updated = await prisma.notification.update({
        where: { id: notif.id },
        data: { readAt: new Date() },
      });
      return { ok: true, notification: updated };
    },
  );

  // Marcar todas como lidas.
  app.post(
    '/notifications/read-all',
    { preHandler: authenticate },
    async (request) => {
      const userId = request.authUser!.id;
      const result = await prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });
      return { ok: true, marked: result.count };
    },
  );

  // Dispatch interno (chamado por outras rotas da API, não pelo cliente diretamente).
  // Recebe service-role key no header para autorizar chamadas server-to-server.
  app.post('/notifications/dispatch', { preHandler: authenticate }, async (request, reply) => {
    const parsed = dispatchInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
    }
    const { userId, type, title, body, relatedDemandId } = parsed.data;

    const notif = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        relatedDemandId: relatedDemandId ?? null,
        channelsSent: ['in_app'],
      },
    });

    // TODO (Fase 2): enfileirar push (Expo/FCM) + e-mail.
    return reply.code(201).send({ ok: true, notification: notif });
  });
}
