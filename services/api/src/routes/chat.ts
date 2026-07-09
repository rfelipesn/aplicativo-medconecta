import type { FastifyInstance } from 'fastify';
import { postChatMessageInputSchema } from '@medconecta/shared';
import { prisma, Prisma } from '@medconecta/db';
import { authenticate, resolveChatAccess } from '../middleware/auth.js';
import { logAssistantAction } from '../lib/audit.js';

function getIp(request: import('fastify').FastifyRequest): string | null {
  return (
    (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    request.ip ??
    null
  );
}

interface PatientParams {
  patientId: string;
}

/**
 * Chat 1:1 entre paciente e seu médico.
 * INVARIANTE: `transcriptionText`/`transcriptionConfidence` (Fase 2) só podem
 * ser expostos ao MÉDICO — nunca ao paciente.
 */
export async function registerChatRoutes(app: FastifyInstance) {
  // ── Sincronização WatermelonDB (pull) ────────────────────────────────────
  app.get<{ Params: PatientParams; Querystring: { last_pulled_at?: string } }>(
    '/patients/:patientId/messages/sync',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const lastPulledAt = request.query.last_pulled_at ? Number(request.query.last_pulled_at) : 0;
      const messages = await prisma.chatMessage.findMany({
        where: { patientId: access.patientId },
        orderBy: { createdAt: 'asc' },
      });

      const created: Record<string, unknown>[] = [];
      const updated: Record<string, unknown>[] = [];
      const deleted: string[] = [];

      for (const m of messages) {
        const payload: Record<string, unknown> = {
          id: m.id,
          patient_id: m.patientId,
          doctor_id: m.doctorId,
          sender_type: m.senderType,
          message_type: m.messageType,
          content_text: m.contentText,
          audio_url: m.audioUrl,
          is_read: m.isRead,
          local_status: 'synced',
          created_at: m.createdAt.getTime(),
          updated_at: m.updatedAt.getTime(),
        };

        if (access.role === 'patient') {
          payload.transcription_text = undefined;
          payload.transcription_confidence = undefined;
        } else {
          payload.transcription_text = m.transcriptionText;
          payload.transcription_confidence = m.transcriptionConfidence;
        }

        if (m.createdAt.getTime() > lastPulledAt) created.push(payload);
        else if (m.updatedAt.getTime() > lastPulledAt) updated.push(payload);
      }

      return { changes: { chat_messages: { created, updated, deleted } }, timestamp: Date.now() };
    },
  );

  // ── Sincronização WatermelonDB (push) ────────────────────────────────────
  interface SyncPushBody {
    changes: {
      chat_messages?: {
        created?: Record<string, unknown>[];
        updated?: Record<string, unknown>[];
        deleted?: string[];
      };
    };
    last_pulled_at: number;
  }

  app.post<{ Params: PatientParams; Body: SyncPushBody }>(
    '/patients/:patientId/messages/sync',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const chatChanges = request.body.changes.chat_messages ?? { created: [], updated: [], deleted: [] };
      const txOps: Prisma.PrismaPromise<unknown>[] = [];

      for (const row of (chatChanges.created ?? []) as Record<string, unknown>[]) {
        txOps.push(
          prisma.chatMessage.upsert({
            where: { id: String(row.id) },
            update: {
              senderType: ((row.sender_type as string) ?? access.role) as 'patient' | 'doctor',
              messageType: ((row.message_type as string) ?? 'text') as 'text' | 'audio' | 'image' | 'document',
              contentText: (row.content_text as string) ?? null,
              audioUrl: (row.audio_url as string) ?? null,
              isRead: Boolean(row.is_read),
              syncStatus: 'synced',
              updatedAt: new Date(),
            },
            create: {
              id: String(row.id),
              patientId: access.patientId,
              doctorId: access.doctorId,
              senderType: ((row.sender_type as string) ?? access.role) as 'patient' | 'doctor',
              messageType: ((row.message_type as string) ?? 'text') as 'text' | 'audio' | 'image' | 'document',
              contentText: (row.content_text as string) ?? null,
              audioUrl: (row.audio_url as string) ?? null,
              isRead: Boolean(row.is_read),
              syncStatus: 'synced',
            },
          }),
        );
      }

      for (const row of (chatChanges.updated ?? []) as Record<string, unknown>[]) {
        txOps.push(
          prisma.chatMessage.updateMany({
            where: { id: String(row.id), patientId: access.patientId },
            data: {
              senderType: ((row.sender_type as string) ?? access.role) as 'patient' | 'doctor',
              messageType: ((row.message_type as string) ?? 'text') as 'text' | 'audio' | 'image' | 'document',
              contentText: (row.content_text as string) ?? null,
              audioUrl: (row.audio_url as string) ?? null,
              isRead: Boolean(row.is_read),
              syncStatus: 'synced',
              updatedAt: new Date(),
            },
          }),
        );
      }

      for (const id of chatChanges.deleted ?? []) {
        txOps.push(
          prisma.chatMessage.deleteMany({
            where: { id, patientId: access.patientId },
          }),
        );
      }

      await prisma.$transaction(txOps);
      return { ok: true };
    },
  );

  app.get<{ Params: PatientParams }>(
    '/patients/:patientId/messages',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const messages = await prisma.chatMessage.findMany({
        where: { patientId: access.patientId },
        orderBy: { createdAt: 'asc' },
      });

      // Paciente nunca recebe a transcrição.
      const sanitized =
        access.role === 'patient'
          ? messages.map(({ transcriptionText, transcriptionConfidence, ...rest }) => {
              void transcriptionText;
              void transcriptionConfidence;
              return rest;
            })
          : messages;

      return { role: access.role, messages: sanitized };
    },
  );

  app.post<{ Params: PatientParams }>(
    '/patients/:patientId/messages',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      // Assistente precisa de permissão explícita para responder (enviar mensagens).
      if (access.role === 'assistant' && access.permissions?.can_respond !== true) {
        return reply.code(403).send({ error: 'forbidden', message: 'Sem permissão para responder.' });
      }

      const parsed = postChatMessageInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
      }

      const message = await prisma.chatMessage.create({
        data: {
          patientId: access.patientId,
          doctorId: access.doctorId,
          senderType: access.role === 'assistant' ? 'doctor' : access.role,
          messageType: 'text',
          contentText: parsed.data.contentText,
          syncStatus: 'synced',
        },
      });

      if (access.role === 'assistant') {
        await logAssistantAction({
          assistantUserId: request.authUser!.id,
          resourceType: 'chat',
          resourceId: message.id,
          action: 'send_message',
          ipAddress: getIp(request),
        });
      }

      // Paciente não recebe transcrição de volta (consistência com o GET).
      if (access.role === 'patient') {
        const { transcriptionText, transcriptionConfidence, ...rest } = message;
        void transcriptionText;
        void transcriptionConfidence;
        return reply.code(201).send({ message: rest });
      }
      return reply.code(201).send({ message });
    },
  );

  app.post<{ Params: PatientParams }>(
    '/patients/:patientId/messages/read',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      // Marca como lidas as mensagens enviadas pela OUTRA parte.
      const senderToMark = access.role === 'doctor' ? 'patient' : 'doctor';
      const result = await prisma.chatMessage.updateMany({
        where: { patientId: access.patientId, senderType: senderToMark, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });

      return { ok: true, marked: result.count };
    },
  );
}
