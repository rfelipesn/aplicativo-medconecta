import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { prisma } from '@medconecta/db';

const expo = new Expo();

interface PushResult {
  ok: boolean;
  invalidTokens?: string[];
  tickets?: ExpoPushTicket[];
  error?: string;
}

/**
 * Envia uma única push notification Expo.
 * - Valida o token antes de enviar (Expo.isExpoPushToken).
 * - NUNCA loga o token (dado sensível).
 * - Retorna `{ ok: false, error: 'invalid_token' }` se o token for inválido.
 */
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<PushResult> {
  if (!Expo.isExpoPushToken(pushToken)) {
    return { ok: false, error: 'invalid_token' };
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  const chunks = expo.chunkPushNotifications([message]);
  const tickets: ExpoPushTicket[] = [];
  for (const chunk of chunks) {
    const result = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...result);
  }

  // Detecta tokens inválidos retornados pela Expo (DeviceNotRegistered etc.)
  const invalidTokens: string[] = [];
  for (const ticket of tickets) {
    if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
      invalidTokens.push(pushToken);
    }
  }

  return { ok: true, tickets, invalidTokens: invalidTokens.length > 0 ? invalidTokens : undefined };
}

interface SendToManyResult {
  sent: number;
  invalidTokens: string[];
  errors: number;
}

/**
 * Envia push para uma lista de tokens Expo.
 * - Filtra tokens inválidos antes de enviar.
 * - Agrupa em chunks (Expo SDK cuida).
 * - Retorna a lista de tokens que falharam (para limpeza opcional no caller).
 */
export async function sendPushToMany(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<SendToManyResult> {
  const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
  const invalidTokens = tokens.filter((t) => !Expo.isExpoPushToken(t));

  if (validTokens.length === 0) {
    return { sent: 0, invalidTokens, errors: 0 };
  }

  const messages: ExpoPushMessage[] = validTokens.map((to) => ({
    to,
    sound: 'default',
    title,
    body,
    data,
  }));

  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  let errors = 0;
  const failedTokens: string[] = [];

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === 'ok') {
          sent += 1;
        } else {
          errors += 1;
          if (ticket.details?.error === 'DeviceNotRegistered') {
            failedTokens.push(chunk[i].to as string);
          }
        }
      }
    } catch (err) {
      // Falha de rede/HTTP: conta o chunk inteiro como erro mas não derruba o envio.
      errors += chunk.length;
    }
  }

  return {
    sent,
    invalidTokens: [...invalidTokens, ...failedTokens],
    errors,
  };
}

/**
 * Envia push para todos os devices registrados de um usuário.
 * - Busca os tokens válidos do userId.
 * - Envia para cada um.
 * - Se houver tokens inválidos, remove-os da base.
 */
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; data?: Record<string, unknown> },
): Promise<SendToManyResult> {
  const tokens = await prisma.pushToken.findMany({
    where: { userId },
    select: { id: true, token: true },
  });
  if (tokens.length === 0) {
    return { sent: 0, invalidTokens: [], errors: 0 };
  }

  const result = await sendPushToMany(
    tokens.map((t) => t.token),
    payload.title,
    payload.body,
    payload.data,
  );

  // Limpa tokens inválidos do banco
  if (result.invalidTokens.length > 0) {
    const invalidSet = new Set(result.invalidTokens);
    const toDelete = tokens.filter((t) => invalidSet.has(t.token)).map((t) => t.id);
    if (toDelete.length > 0) {
      await prisma.pushToken
        .deleteMany({ where: { id: { in: toDelete } } })
        .catch(() => undefined);
    }
  }

  return result;
}
