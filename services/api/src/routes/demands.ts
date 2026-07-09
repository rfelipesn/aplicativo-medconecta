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
            data: { type: 'new_demand', demandId: demand.id },
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

      return { demands, total };
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

      return { demands };
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

      return { demand };
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
      if (responseNotes !== undefined) {
        // Concatenar notas ao histórico (description armazena a questão original;
        // usamos um campo dedicado no futuro; por ora, guardamos no título se vazio)
        // NOTA: para MVP, não temos campo de "responseNotes" no schema Prisma.
        // Salvaremos como parte de description (append).
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
        await createNotification({
          userId: demand.patient.userId,
          type: 'demand_response',
          title: 'Sua demanda recebeu resposta',
          body: preview,
          relatedDemandId: demand.id,
        });
        // Enviar push notification para o paciente
        try {
          const { sendPushToUser } = await import('../lib/pushNotifications.js');
          await sendPushToUser(demand.patient.userId, {
            title: 'Sua demanda recebeu resposta',
            body: preview,
            data: { type: 'demand_response', demandId: demand.id },
          });
        } catch (err) {
          app.log.warn({ err }, 'push notification to patient failed (non-blocking)');
        }
      }

      return { ok: true, demand: updated };
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
}
