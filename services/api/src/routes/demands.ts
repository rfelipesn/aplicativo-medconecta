import type { FastifyInstance } from 'fastify';
import {
  createDemandInputSchema,
  updateDemandStatusInputSchema,
  demandSearchParamsSchema,
} from '@medconecta/shared';
import { prisma } from '@medconecta/db';
import { authenticate, getDoctorForRequest, resolveChatAccess } from '../middleware/auth.js';
import { createNotification } from '../lib/notifications.js';
import { triageDemand } from './ai.js';
import { auditLog, logAssistantAction } from '../lib/audit.js';

function getIp(request: import('fastify').FastifyRequest): string | null {
  return (
    (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    request.ip ??
    null
  );
}

/**
 * Extrai `responseNotes` derivado do campo `description`.
 *
 * O schema Prisma atual não possui coluna dedicada para a resposta do médico,
 * então ela é persistida como um bloco "— Resposta do médico (ISO):\n…" no
 * final de `description`. Esta função separa os dois para o frontend, que
 * espera `responseNotes` como campo distinto. Quando houver migration para um
 * campo dedicado, basta removê-la.
 */
const RESPONSE_MARKER = '\n\n— Resposta do médico (';

function splitResponseNotes(description: string | null | undefined): {
  description: string | null;
  responseNotes: string | null;
} {
  if (!description) return { description: null, responseNotes: null };
  const idx = description.indexOf(RESPONSE_MARKER);
  if (idx === -1) return { description, responseNotes: null };
  const original = description.slice(0, idx).trim() || null;
  const block = description.slice(idx + RESPONSE_MARKER.length);
  // bloco: "2026-07-17T...):\n<notas>"
  const nl = block.indexOf('\n');
  const notes = nl === -1 ? block.trim() : block.slice(nl + 1).trim();
  return { description: original, responseNotes: notes || null };
}

/** Aplica `splitResponseNotes` a uma demanda (ou lista) para o frontend. */
function withResponseNotes<T extends { description?: string | null }>(
  demand: T,
): T & { responseNotes: string | null } {
  const { description, responseNotes } = splitResponseNotes(demand.description);
  return { ...demand, description, responseNotes };
}

/**
 * Rotas de Demandas.
 *
 * Demandas são solicitações assíncronas do paciente ao médico (renovação de receita,
 * agendamento, envio de exame, relato de sintoma, pergunta geral, segunda opinião).
 * Seguem o fluxo eletivo — NUNCA emergência.
 */
export async function registerDemandRoutes(app: FastifyInstance) {
  // ── Criar demanda ────────────────────────────────────────────────────────
  app.post(
    '/demands',
    { preHandler: authenticate },
    async (request, reply) => {
      // Paciente autenticado
      const patient = await prisma.patient.findUnique({
        where: { userId: request.authUser!.id },
        include: { user: { select: { fullName: true } } },
      });
      if (!patient) {
        return reply.code(403).send({ error: 'forbidden' });
      }

      const parsed = createDemandInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.flatten() });
      }
      const { title, description, type, priority } = parsed.data;

      // Triagem IA se prioridade não foi explicitamente fornecida
      let finalPriority = priority ?? null;
      let aiConfidenceScore: number | null = null;

      if (!priority) {
        const triage = await triageDemand(description, type);
        finalPriority = triage.priority;
        aiConfidenceScore = triage.confidence;
      }

      const demand = await prisma.demand.create({
        data: {
          patientId: patient.id,
          doctorId: patient.doctorId,
          title: title ?? null,
          description,
          type,
          priority: finalPriority,
          aiConfidenceScore,
          status: 'open',
        },
        include: {
          patient: {
            select: {
              id: true,
              user: { select: { fullName: true } },
            },
          },
        },
      });

      // Notificar o médico
      const doctor = await prisma.doctor.findUnique({
        where: { id: patient.doctorId },
        select: { userId: true },
      });
      if (doctor) {
        const demandTypeLabels: Record<string, string> = {
          recipe_renewal: 'Renovação de receita',
          appointment_request: 'Solicitação de agendamento',
          exam_result: 'Resultado de exame',
          symptom_log: 'Relato de sintoma',
          general_question: 'Pergunta geral',
          second_opinion: 'Segunda opinião',
        };
        const title2 = demandTypeLabels[type] ?? 'Nova demanda';
        const bodyPreview = description.slice(0, 120) + (description.length > 120 ? '…' : '');
        await createNotification({
          userId: doctor.userId,
          type: 'new_demand',
          title: `${title2} — ${patient.user.fullName}`,
          body: bodyPreview,
          relatedDemandId: demand.id,
        });
        // Enviar push notification para o médico
        try {
          const { sendPushToUser } = await import('../lib/pushNotifications.js');
          await sendPushToUser(doctor.userId, {
            title: title2,
            body: `${patient.user.fullName}: ${bodyPreview}`,
            data: { type: 'new_demand', relatedDemandId: demand.id },
          });
        } catch (err) {
          app.log.warn({ err }, 'push notification failed (non-blocking)');
        }
      }

      return reply.code(201).send({ ok: true, demand });
    },
  );

  // ── Listar demandas do médico (visão global) ───────────────────────────
  app.get(
    '/demands',
    { preHandler: authenticate },
    async (request, reply) => {
      const doctor = await getDoctorForRequest(request);
      if (!doctor) {
        return reply.code(403).send({ error: 'forbidden' });
      }

      const parsed = demandSearchParamsSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.flatten() });
      }
      const { status, type, priority, limit, offset } = parsed.data;

      const where = {
        doctorId: doctor.id,
        ...(status && { status }),
        ...(type && { type }),
        ...(priority && { priority }),
      };

      const [demands, total] = await Promise.all([
        prisma.demand.findMany({
          where,
          include: {
            patient: {
              select: {
                id: true,
                user: { select: { fullName: true, phone: true } },
              },
            },
          },
          orderBy: [
            // urgent primeiro, depois elective, informational, other
            { priority: 'asc' as const },
            { createdAt: 'desc' as const },
          ],
          take: limit,
          skip: offset,
        }),
        prisma.demand.count({ where }),
      ]);

      return { demands: demands.map(withResponseNotes), total };
    },
  );

  // ── Listar demandas de um paciente ─────────────────────────────────────
  app.get<{ Params: { patientId: string } }>(
    '/patients/:patientId/demands',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) {
        return reply.code(403).send({ error: 'forbidden' });
      }

      const demands = await prisma.demand.findMany({
        where: { patientId: access.patientId },
        include: {
          patient: {
            select: {
              id: true,
              user: { select: { fullName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { demands: demands.map(withResponseNotes) };
    },
  );

  // ── Obter demanda por ID ────────────────────────────────────────────────
  app.get<{ Params: { demandId: string } }>(
    '/demands/:demandId',
    { preHandler: authenticate },
    async (request, reply) => {
      const { demandId } = request.params;
      const userId = request.authUser!.id;

      const demand = await prisma.demand.findUnique({
        where: { id: demandId },
        include: {
          patient: {
            select: {
              id: true,
              userId: true,
              doctorId: true,
              user: { select: { fullName: true, phone: true } },
            },
          },
          doctor: {
            select: {
              id: true,
              userId: true,
              user: { select: { fullName: true } },
            },
          },
        },
      });
      if (!demand) {
        return reply.code(404).send({ error: 'not_found' });
      }

      // Autorização: paciente dono OU médico responsável
      const isPatient = demand.patient.userId === userId;
      const isDoctor = demand.doctor.userId === userId;
      if (!isPatient && !isDoctor) {
        return reply.code(403).send({ error: 'forbidden' });
      }

      return { demand: withResponseNotes(demand) };
    },
  );

  // ── Responder demanda (médico ou assistente com can_respond) ─────────────
  app.patch<{ Params: { demandId: string } }>(
    '/demands/:demandId/respond',
    { preHandler: authenticate },
    async (request, reply) => {
      const doctor = await getDoctorForRequest(request);
      const userId = request.authUser!.id;

      const parsed = updateDemandStatusInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.flatten() });
      }
      const { status, responseNotes } = parsed.data;

      // Status deve ser responded, closed ou pending_action
      if (!['responded', 'closed', 'pending_action'].includes(status)) {
        return reply.code(400).send({ error: 'invalid_status' });
      }

      const demand = await prisma.demand.findUnique({
        where: { id: request.params.demandId },
        include: {
          patient: {
            select: { userId: true, user: { select: { fullName: true } } },
          },
        },
      });
      if (!demand) {
        return reply.code(404).send({ error: 'not_found' });
      }
      if (demand.status === 'closed') {
        return reply.code(400).send({ error: 'demand_already_closed' });
      }

      // Identificar quem está agindo: médico ou assistente.
      let actingAsAssistant = false;
      if (doctor && doctor.id === demand.doctorId) {
        // médico responsável
        actingAsAssistant = false;
      } else {
        const assistant = await prisma.doctorAssistant.findFirst({
          where: { assistantUserId: userId, doctorId: demand.doctorId },
        });
        const perms = (assistant?.permissions ?? {}) as {
          can_respond?: boolean;
        };
        if (assistant && perms.can_respond === true) {
          actingAsAssistant = true;
        } else {
          return reply.code(403).send({ error: 'forbidden' });
        }
      }

      const data: Record<string, unknown> = { status };
      if (status === 'responded') data.respondedAt = new Date();
      if (status === 'closed') data.closedAt = new Date();
      if (responseNotes !== undefined && responseNotes.trim()) {
        // O schema Prisma atual não possui campo dedicado para responseNotes.
        // Persistimos as notas com marcador no campo `description` (append),
        // preservando a descrição original do paciente. Quando houver migration
        // para um campo dedicado, basta substituir este bloco.
        const notes = responseNotes.trim();
        const original = demand.description ?? '';
        const stamp = new Date().toISOString();
        data.description = original
          ? `${original}\n\n— Resposta do médico (${stamp}):\n${notes}`
          : `Resposta do médico (${stamp}):\n${notes}`;
      }

      const updated = await prisma.demand.update({
        where: { id: demand.id },
        data,
        include: {
          patient: {
            select: {
              id: true,
              user: { select: { fullName: true, phone: true } },
            },
          },
        },
      });

      // Auditoria
      if (actingAsAssistant) {
        await logAssistantAction({
          assistantUserId: userId,
          resourceType: 'demand',
          resourceId: demand.id,
          action: 'respond_demand',
          ipAddress: getIp(request),
        });
      } else {
        await auditLog({
          userId: userId,
          resourceType: 'demand',
          resourceId: demand.id,
          action: 'respond_demand',
          ipAddress: getIp(request),
        });
      }

      // Notificar o paciente
      if (status === 'responded') {
        const preview =
          responseNotes && responseNotes.trim()
            ? responseNotes.trim().slice(0, 120) + (responseNotes.length > 120 ? '…' : '')
            : 'Sua demanda foi respondida.';
        // Buscar nome do médico para título mais humano.
        const doctorRow = await prisma.doctor.findUnique({
          where: { id: demand.doctorId },
          select: { user: { select: { fullName: true } } },
        });
        const doctorName = doctorRow?.user?.fullName ?? 'Médico';
        const demandTypeLabels2: Record<string, string> = {
          recipe_renewal: 'Renovação de receita',
          appointment_request: 'Agendamento',
          exam_result: 'Resultado de exame',
          symptom_log: 'Relato de sintoma',
          general_question: 'Pergunta geral',
          second_opinion: 'Segunda opinião',
        };
        const demandLabel = demandTypeLabels2[demand.type] ?? 'Demanda';
        const notifTitle = `Dr. ${doctorName} respondeu sua demanda`;
        await createNotification({
          userId: demand.patient.userId,
          type: 'demand_response',
          title: notifTitle,
          body: `${demandLabel}: ${preview}`,
          relatedDemandId: demand.id,
        });
        // Enviar push notification para o paciente
        try {
          const { sendPushToUser } = await import('../lib/pushNotifications.js');
          await sendPushToUser(demand.patient.userId, {
            title: notifTitle,
            body: `${demandLabel}: ${preview}`,
            data: { type: 'demand_response', relatedDemandId: demand.id },
          });
        } catch (err) {
          app.log.warn({ err }, 'push notification to patient failed (non-blocking)');
        }
      }

      return { ok: true, demand: withResponseNotes(updated) };
    },
  );

  // ── Atualizar status (qualquer parte) ───────────────────────────────────
  app.patch<{ Params: { demandId: string } }>(
    '/demands/:demandId/status',
    { preHandler: authenticate },
    async (request, reply) => {
      const { demandId } = request.params;
      const userId = request.authUser!.id;

      const demand = await prisma.demand.findUnique({
        where: { id: demandId },
        include: {
          patient: { select: { userId: true, doctorId: true } },
          doctor: { select: { userId: true } },
        },
      });
      if (!demand) {
        return reply.code(404).send({ error: 'not_found' });
      }

      // Identificar papel: paciente dono, médico responsável ou assistente.
      let actingAsAssistant = false;
      if (
        demand.patient.userId === userId ||
        demand.doctor.userId === userId
      ) {
        actingAsAssistant = false;
      } else {
        const assistant = await prisma.doctorAssistant.findFirst({
          where: { assistantUserId: userId, doctorId: demand.doctorId },
        });
        const perms = (assistant?.permissions ?? {}) as {
          can_respond?: boolean;
        };
        if (assistant && perms.can_respond === true) {
          actingAsAssistant = true;
        } else {
          return reply.code(403).send({ error: 'forbidden' });
        }
      }

      const body = request.body as { status?: string };
      if (body?.status !== 'closed') {
        return reply.code(400).send({ error: 'only_closed_allowed' });
      }

      await prisma.demand.update({
        where: { id: demand.id },
        data: { status: 'closed', closedAt: new Date() },
      });

      if (actingAsAssistant) {
        await logAssistantAction({
          assistantUserId: userId,
          resourceType: 'demand',
          resourceId: demand.id,
          action: 'close_demand',
          ipAddress: getIp(request),
        });
      }

      return { ok: true };
    },
  );

  // ── Confirmar consulta (médico responde a demanda de agendamento) ─────────
  // Marca a demanda como 'responded' e envia notificação ao paciente com
  // data/hora/local da consulta confirmada.
  app.patch<{ Params: { demandId: string } }>(
    '/demands/:demandId/confirm-appointment',
    { preHandler: authenticate },
    async (request, reply) => {
      const doctor = await getDoctorForRequest(request);
      const userId = request.authUser!.id;

      const body = request.body as {
        date?: string;
        time?: string;
        location?: string;
      };
      if (!body?.date || !body?.time || !body?.location?.trim()) {
        return reply
          .code(400)
          .send({ error: 'validation', message: 'date, time e location são obrigatórios.' });
      }

      const demand = await prisma.demand.findUnique({
        where: { id: request.params.demandId },
        include: {
          patient: {
            select: { userId: true, user: { select: { fullName: true } } },
          },
        },
      });
      if (!demand) return reply.code(404).send({ error: 'not_found' });
      if (demand.status === 'closed') {
        return reply.code(400).send({ error: 'demand_already_closed' });
      }

      // Autorização: médico responsável OU assistente com can_respond.
      let actingAsAssistant = false;
      if (doctor && doctor.id === demand.doctorId) {
        actingAsAssistant = false;
      } else {
        const assistant = await prisma.doctorAssistant.findFirst({
          where: { assistantUserId: userId, doctorId: demand.doctorId },
        });
        const perms = (assistant?.permissions ?? {}) as { can_respond?: boolean };
        if (assistant && perms.can_respond === true) {
          actingAsAssistant = true;
        } else {
          return reply.code(403).send({ error: 'forbidden' });
        }
      }

      const dateStr = body.date;
      const timeStr = body.time;
      const location = body.location.trim();
      const confirmNotes = `Consulta confirmada\nData: ${dateStr}\nHorário: ${timeStr}\nLocal: ${location}`;

      const original = demand.description ?? '';
      const stamp = new Date().toISOString();
      const newDescription = original
        ? `${original}\n\n— Resposta do médico (${stamp}):\n${confirmNotes}`
        : `Resposta do médico (${stamp}):\n${confirmNotes}`;

      const updated = await prisma.demand.update({
        where: { id: demand.id },
        data: {
          status: 'responded',
          respondedAt: new Date(),
          description: newDescription,
        },
      });

      if (actingAsAssistant) {
        await logAssistantAction({
          assistantUserId: userId,
          resourceType: 'demand',
          resourceId: demand.id,
          action: 'confirm_appointment',
          ipAddress: getIp(request),
        });
      } else {
        await auditLog({
          userId,
          resourceType: 'demand',
          resourceId: demand.id,
          action: 'confirm_appointment',
          ipAddress: getIp(request),
        });
      }

      // Notificar o paciente (in-app + push).
      const doctorRow = await prisma.doctor.findUnique({
        where: { id: demand.doctorId },
        select: { user: { select: { fullName: true } } },
      });
      const doctorName = doctorRow?.user?.fullName ?? 'Médico';
      const notifTitle = `Dr. ${doctorName} confirmou sua consulta`;
      const notifBody = `Data: ${dateStr} · Horário: ${timeStr} · Local: ${location}`;
      await createNotification({
        userId: demand.patient.userId,
        type: 'appointment_confirmed',
        title: notifTitle,
        body: notifBody,
        relatedDemandId: demand.id,
      });
      try {
        const { sendPushToUser } = await import('../lib/pushNotifications.js');
        await sendPushToUser(demand.patient.userId, {
          title: notifTitle,
          body: notifBody,
          data: { type: 'appointment_confirmed', relatedDemandId: demand.id },
        });
      } catch (err) {
        app.log.warn({ err }, 'push appointment_confirmed failed (non-blocking)');
      }

      return { ok: true, demand: withResponseNotes(updated) };
    },
  );
}
