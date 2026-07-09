import { prisma } from '@medconecta/db';
import { sendPushToMany } from './pushNotifications.js';

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  relatedDemandId?: string;
  channelsSent?: string[];
  /**
   * Disparar também push notification para os devices do usuário.
   * Default: true (canal `push` é incluído em `channelsSent` quando enviado).
   */
  sendPush?: boolean;
}

/**
 * Cria notificação in-app persistida no banco.
 *
 * Se `sendPush !== false`, busca os tokens Expo Push do usuário e tenta
 * enviar push em background (erros não derrubam a transação in-app).
 *
 * INVARIANTE: nunca expor informações sensíveis (diagnóstico, etc.) no
 * título/corpo (vale tanto para a notificação in-app quanto para a push).
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  relatedDemandId,
  channelsSent = ['in_app'],
  sendPush = true,
}: CreateNotificationParams) {
  const finalChannels: string[] = [...channelsSent];

  // Enfileira push em background — não bloqueia o caller nem propaga erros.
  let pushPromise: Promise<unknown> | null = null;
  if (sendPush) {
    pushPromise = (async () => {
      const tokens = await prisma.pushToken.findMany({
        where: { userId },
        select: { token: true },
      });
      if (tokens.length === 0) return;
      const result = await sendPushToMany(
        tokens.map((t: { token: string }) => t.token),
        title,
        body,
        { type, relatedDemandId: relatedDemandId ?? null },
      );
      if (result.sent > 0 && !finalChannels.includes('push')) {
        finalChannels.push('push');
      }
      // Limpa tokens inválidos (DeviceNotRegistered / formato errado).
      if (result.invalidTokens.length > 0) {
        await prisma.pushToken.deleteMany({
          where: { userId, token: { in: result.invalidTokens } },
        });
      }
    })();
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        relatedDemandId: relatedDemandId ?? null,
        channelsSent: finalChannels,
      },
    });
    return notification;
  } finally {
    // Garante que o push rode mesmo se o caller descartar a promise.
    if (pushPromise) {
      pushPromise.catch(() => {
        /* erros já são silenciosos; logs do sendPushToMany via app logger */
      });
    }
  }
}
