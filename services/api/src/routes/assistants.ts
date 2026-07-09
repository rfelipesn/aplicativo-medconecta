import type { FastifyInstance } from 'fastify';
import {
  createAssistantInputSchema,
  updateAssistantPermissionsInputSchema,
  DEFAULT_ASSISTANT_PERMISSIONS,
  type AssistantPermissions,
} from '@medconecta/shared';
import { prisma } from '@medconecta/db';
import { authenticate, getDoctorForRequest } from '../middleware/auth.js';
import { createAuthUser, deleteAuthUser, SupabaseAuthError } from '../lib/supabase.js';
import { auditLog } from '../lib/audit.js';

function getIp(request: import('fastify').FastifyRequest): string | null {
  return (
    (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    request.ip ??
    null
  );
}

function isPermissions(value: unknown): value is AssistantPermissions {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.can_view === 'boolean' &&
    typeof v.can_respond === 'boolean' &&
    typeof v.can_approve_recipes === 'boolean'
  );
}

/**
 * Rotas de gerenciamento de Assistentes (DoctorAssistant).
 * Apenas o médico responsável pode listar, criar, atualizar e remover
 * os assistentes vinculados ao seu perfil.
 *
 * Auditoria: toda mutação registra um AuditLog com `resourceType: 'doctor_assistant'`.
 */
export async function registerAssistantRoutes(app: FastifyInstance) {
  // ── Listar assistentes do médico logado ──────────────────────────────────
  app.get('/assistants', { preHandler: authenticate }, async (request, reply) => {
    const doctor = await getDoctorForRequest(request);
    if (!doctor) return reply.code(403).send({ error: 'not_a_doctor' });

    const assistants = await prisma.doctorAssistant.findMany({
      where: { doctorId: doctor.id },
      orderBy: { createdAt: 'desc' },
      include: {
        assistantUser: {
          select: { id: true, fullName: true, email: true, phone: true, cpf: true },
        },
      },
    });

    const payload = assistants.map((a) => ({
      id: a.id,
      doctorId: a.doctorId,
      assistantUserId: a.assistantUserId,
      permissions: isPermissions(a.permissions) ? a.permissions : DEFAULT_ASSISTANT_PERMISSIONS,
      createdAt: a.createdAt.toISOString(),
      user: a.assistantUser,
    }));

    return { assistants: payload };
  });

  // ── Criar assistente ─────────────────────────────────────────────────────
  app.post('/assistants', { preHandler: authenticate }, async (request, reply) => {
    const doctor = await getDoctorForRequest(request);
    if (!doctor) return reply.code(403).send({ error: 'not_a_doctor' });

    const parsed = createAssistantInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
    }
    const input = parsed.data;
    const ip = getIp(request);

    const cpfDigits = input.cpf;
    const permissions = input.permissions ?? DEFAULT_ASSISTANT_PERMISSIONS;

    // 1) Criar o usuário no Supabase Auth
    let authUserId: string;
    try {
      const authUser = await createAuthUser({
        email: input.email,
        password: input.initialPassword,
        userMetadata: { full_name: input.fullName, role: 'assistant' },
      });
      authUserId = authUser.id;
    } catch (err) {
      if (err instanceof SupabaseAuthError) {
        const status = err.status === 422 ? 409 : err.status;
        return reply.code(status).send({ error: 'auth_create_failed', message: err.message });
      }
      throw err;
    }

    // 2) Criar User (public.users) + DoctorAssistant em transação
    try {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            id: authUserId,
            email: input.email,
            phone: input.phone,
            cpf: cpfDigits,
            fullName: input.fullName,
            role: 'assistant',
            mustChangePassword: true,
          },
        });

        const link = await tx.doctorAssistant.create({
          data: {
            doctorId: doctor.id,
            assistantUserId: user.id,
            permissions,
            createdBy: doctor.userId,
          },
        });

        return { user, link };
      });

      await auditLog({
        userId: doctor.userId,
        resourceType: 'doctor_assistant',
        resourceId: result.link.id,
        action: 'create_assistant',
        ipAddress: ip,
      });

      return reply.code(201).send({
        ok: true,
        assistant: {
          id: result.link.id,
          doctorId: result.link.doctorId,
          assistantUserId: result.link.assistantUserId,
          permissions,
          createdAt: result.link.createdAt.toISOString(),
          user: {
            id: result.user.id,
            fullName: result.user.fullName,
            email: result.user.email,
            phone: result.user.phone,
            cpf: result.user.cpf,
          },
        },
        credentials: {
          email: input.email,
          password: input.initialPassword,
          hint: 'O assistente deve alterar a senha no primeiro acesso.',
        },
      });
    } catch (err) {
      await deleteAuthUser(authUserId).catch(() => undefined);
      const code = (err as { code?: string }).code;
      if (code === 'P2002') {
        return reply
          .code(409)
          .send({ error: 'conflict', message: 'CPF, telefone ou e-mail já cadastrado.' });
      }
      app.log.error({ err }, 'assistant creation failed');
      return reply.code(500).send({ error: 'assistant_create_failed' });
    }
  });

  // ── Atualizar permissões do assistente ───────────────────────────────────
  app.patch<{ Params: { assistantId: string } }>(
    '/assistants/:assistantId/permissions',
    { preHandler: authenticate },
    async (request, reply) => {
      const doctor = await getDoctorForRequest(request);
      if (!doctor) return reply.code(403).send({ error: 'not_a_doctor' });

      const parsed = updateAssistantPermissionsInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
      }

      const existing = await prisma.doctorAssistant.findUnique({
        where: { id: request.params.assistantId },
      });
      if (!existing) return reply.code(404).send({ error: 'not_found' });
      if (existing.doctorId !== doctor.id) {
        return reply.code(403).send({ error: 'forbidden' });
      }

      const updated = await prisma.doctorAssistant.update({
        where: { id: existing.id },
        data: { permissions: parsed.data.permissions },
      });

      await auditLog({
        userId: doctor.userId,
        resourceType: 'doctor_assistant',
        resourceId: updated.id,
        action: 'update_permissions',
        ipAddress: getIp(request),
      });

      return {
        ok: true,
        assistant: {
          id: updated.id,
          permissions: updated.permissions,
        },
      };
    },
  );

  // ── Remover vínculo de assistente ────────────────────────────────────────
  app.delete<{ Params: { assistantId: string } }>(
    '/assistants/:assistantId',
    { preHandler: authenticate },
    async (request, reply) => {
      const doctor = await getDoctorForRequest(request);
      if (!doctor) return reply.code(403).send({ error: 'not_a_doctor' });

      const existing = await prisma.doctorAssistant.findUnique({
        where: { id: request.params.assistantId },
      });
      if (!existing) return reply.code(404).send({ error: 'not_found' });
      if (existing.doctorId !== doctor.id) {
        return reply.code(403).send({ error: 'forbidden' });
      }

      await prisma.doctorAssistant.delete({ where: { id: existing.id } });

      await auditLog({
        userId: doctor.userId,
        resourceType: 'doctor_assistant',
        resourceId: existing.id,
        action: 'delete_assistant',
        ipAddress: getIp(request),
      });

      return { ok: true };
    },
  );
}
