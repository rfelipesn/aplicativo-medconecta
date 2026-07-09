import type { FastifyInstance } from 'fastify';
import { createRecipeRequestInputSchema, BUSINESS_RULES } from '@medconecta/shared';
import { prisma } from '@medconecta/db';
import { authenticate, resolveChatAccess, getDoctorForRequest } from '../middleware/auth.js';
import { auditLog, logAssistantAction } from '../lib/audit.js';

function getIp(request: import('fastify').FastifyRequest): string | null {
  return (
    (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    request.ip ??
    null
  );
}

interface PatientParams { patientId: string }
interface RecipeParams { recipeId: string }

/**
 * Fluxo de Solicitação de Receita (SLA burocrático 72h).
 *
 * Quem solicita: o PACIENTE (ou o médico em nome do paciente).
 * Quem responde: o MÉDICO (marca como 'responded').
 * SLA: 72h a partir da criação; após o prazo → 'expired'.
 *
 * NÃO é fluxo clínico. Nunca usar para urgências.
 */
export async function registerRecipeRoutes(app: FastifyInstance) {
  // -- Paciente ou médico: lista receitas de um paciente --
  app.get<{ Params: PatientParams }>(
    '/patients/:patientId/recipes',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const recipes = await prisma.recipeRequest.findMany({
        where: { patientId: access.patientId },
        orderBy: { createdAt: 'desc' },
      });
      return { recipes };
    },
  );

  // -- Paciente solicita uma receita --
  app.post<{ Params: PatientParams }>(
    '/patients/:patientId/recipes',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const parsed = createRecipeRequestInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
      }

      const slaDeadline = new Date(
        Date.now() + BUSINESS_RULES.RECIPE_SLA_HOURS * 60 * 60 * 1000,
      );

      const recipe = await prisma.recipeRequest.create({
        data: {
          patientId: access.patientId,
          doctorId: access.doctorId,
          medicationNames: parsed.data.medicationNames,
          quantityDays: parsed.data.quantityDays ?? null,
          reason: parsed.data.reason ?? null,
          slaDeadline,
        },
      });

      return reply.code(201).send({ recipe });
    },
  );

  // -- Médico: lista TODAS as receitas pendentes (todas as patients) --
  app.get(
    '/recipes',
    { preHandler: authenticate },
    async (request, reply) => {
      const doctor = await getDoctorForRequest(request);
      if (!doctor) return reply.code(403).send({ error: 'not_a_doctor' });

      const { status } = request.query as { status?: string };
      const recipes = await prisma.recipeRequest.findMany({
        where: {
          doctorId: doctor.id,
          ...(status ? { status: status as 'pending' | 'responded' | 'expired' } : {}),
        },
        orderBy: [{ status: 'asc' }, { slaDeadline: 'asc' }],
        include: {
          patient: {
            include: { user: { select: { fullName: true } } },
          },
        },
      });
      return { recipes };
    },
  );

  // -- Médico (ou assistente com can_approve_recipes): responde uma receita --
  app.patch<{ Params: RecipeParams }>(
    '/recipes/:recipeId/respond',
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.authUser!.id;
      const doctor = await getDoctorForRequest(request);

      const recipe = await prisma.recipeRequest.findUnique({
        where: { id: request.params.recipeId },
      });
      if (!recipe) return reply.code(404).send({ error: 'not_found' });
      if (recipe.status !== 'pending') {
        return reply.code(409).send({ error: 'already_resolved', status: recipe.status });
      }

      // Identificar papel: médico responsável ou assistente com can_approve_recipes.
      let actingAsAssistant = false;
      if (doctor && doctor.id === recipe.doctorId) {
        actingAsAssistant = false;
      } else {
        const assistant = await prisma.doctorAssistant.findFirst({
          where: { assistantUserId: userId, doctorId: recipe.doctorId },
        });
        const perms = (assistant?.permissions ?? {}) as {
          can_approve_recipes?: boolean;
        };
        if (assistant && perms.can_approve_recipes === true) {
          actingAsAssistant = true;
        } else {
          return reply.code(403).send({ error: 'forbidden' });
        }
      }

      const updated = await prisma.recipeRequest.update({
        where: { id: recipe.id },
        data: { status: 'responded', responseDate: new Date() },
      });

      if (actingAsAssistant) {
        await logAssistantAction({
          assistantUserId: userId,
          resourceType: 'recipe',
          resourceId: recipe.id,
          action: 'respond_recipe',
          ipAddress: getIp(request),
        });
      } else {
        await auditLog({
          userId,
          resourceType: 'recipe',
          resourceId: recipe.id,
          action: 'respond_recipe',
          ipAddress: getIp(request),
        });
      }

      return { recipe: updated };
    },
  );

  // -- Cron/manual: expira receitas com SLA vencido --
  app.get(
    '/recipes/sla/check',
    async () => {
      const now = new Date();
      const result = await prisma.recipeRequest.updateMany({
        where: { status: 'pending', slaDeadline: { lt: now } },
        data: { status: 'expired' },
      });

      const soonDeadline = new Date(
        now.getTime() + BUSINESS_RULES.RECIPE_REMINDER_HOURS * 60 * 60 * 1000,
      );
      const nearDeadline = await prisma.recipeRequest.count({
        where: {
          status: 'pending',
          slaDeadline: { gte: now, lte: soonDeadline },
        },
      });

      return {
        ok: true,
        expired: result.count,
        nearDeadline,
        slaHours: BUSINESS_RULES.RECIPE_SLA_HOURS,
        reminderHours: BUSINESS_RULES.RECIPE_REMINDER_HOURS,
      };
    },
  );
}
