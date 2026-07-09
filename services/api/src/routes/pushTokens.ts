import type { FastifyInstance } from 'fastify';
import { registerPushTokenInputSchema } from '@medconecta/shared';
import { prisma } from '@medconecta/db';
import { authenticate } from '../middleware/auth.js';
import { Expo } from 'expo-server-sdk';

/**
 * Rotas de registro de Push Tokens (Expo).
 *
 * - POST /push-tokens: registra (ou atualiza, se já existe para este user+device)
 *   o token Expo Push do device do usuário autenticado.
 * - GET /push-tokens: lista os tokens do usuário autenticado (apenas para debug).
 * - DELETE /push-tokens/:tokenId: remove um token (ex.: logout, ou DeviceNotRegistered).
 */
export async function registerPushTokenRoutes(app: FastifyInstance) {
  // ── Registrar / atualizar token ────────────────────────────────────────
  app.post(
    '/push-tokens',
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.authUser!.id;

      const parsed = registerPushTokenInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
      }
      const { token, deviceId, platform } = parsed.data;

      // Defesa em profundidade: rejeita token malformado mesmo se o cliente
      // burlou a validação do schema.
      if (!Expo.isExpoPushToken(token)) {
        return reply.code(400).send({ error: 'invalid_token' });
      }

      const row = await prisma.pushToken.upsert({
        where: { userId_deviceId: { userId, deviceId } },
        create: { userId, token, deviceId, platform },
        update: { token, platform },
      });

      return reply.code(200).send({ ok: true, pushToken: row });
    },
  );

  // ── Listar meus tokens ─────────────────────────────────────────────────
  app.get(
    '/push-tokens',
    { preHandler: authenticate },
    async (request) => {
      const userId = request.authUser!.id;
      const tokens = await prisma.pushToken.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
      return { pushTokens: tokens };
    },
  );

  // ── Remover token ──────────────────────────────────────────────────────
  app.delete<{ Params: { tokenId: string } }>(
    '/push-tokens/:tokenId',
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.authUser!.id;
      const { tokenId } = request.params;

      const existing = await prisma.pushToken.findUnique({ where: { id: tokenId } });
      if (!existing || existing.userId !== userId) {
        return reply.code(404).send({ error: 'not_found' });
      }

      await prisma.pushToken.delete({ where: { id: tokenId } });
      return { ok: true };
    },
  );
}
