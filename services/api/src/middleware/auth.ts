import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@medconecta/db';
import { getAuthUserFromToken } from '../lib/supabase.js';
import type { AssistantPermissions } from '@medconecta/shared';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: { id: string; email?: string };
  }
}

/**
 * preHandler: exige um Bearer token válido do Supabase Auth.
 * Anexa `request.authUser` com o id (= auth.users.id = public.users.id).
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'unauthorized', message: 'Token ausente.' });
  }
  const token = header.slice('Bearer '.length).trim();
  const user = await getAuthUserFromToken(token);
  if (!user) {
    return reply.code(401).send({ error: 'unauthorized', message: 'Token inválido ou expirado.' });
  }
  request.authUser = user;
}

/** Carrega o perfil de médico do usuário logado (ou null se não for médico). */
export async function getDoctorForRequest(request: FastifyRequest) {
  const userId = request.authUser?.id;
  if (!userId) return null;
  return prisma.doctor.findUnique({ where: { userId } });
}

export type ChatRole = 'doctor' | 'patient' | 'assistant';

export interface ChatAccess {
  patientId: string;
  doctorId: string;
  /** Papel de quem fez a requisição neste contexto de chat. */
  role: ChatRole;
  /** Presente quando role === 'assistant' (granularidade de permissões). */
  permissions?: AssistantPermissions;
}

/**
 * Autoriza acesso ao chat de um paciente. Permitido para:
 *  - o próprio paciente, OU
 *  - o médico responsável por aquele paciente, OU
 *  - um assistente do médico responsável, desde que tenha `can_view === true`.
 * Retorna null se não encontrado ou sem permissão.
 */
export async function resolveChatAccess(
  request: FastifyRequest,
  patientId: string,
): Promise<ChatAccess | null> {
  const userId = request.authUser?.id;
  if (!userId) return null;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { doctor: { select: { id: true, userId: true } } },
  });
  if (!patient) return null;

  if (patient.userId === userId) {
    return { patientId: patient.id, doctorId: patient.doctorId, role: 'patient' };
  }
  if (patient.doctor.userId === userId) {
    return { patientId: patient.id, doctorId: patient.doctorId, role: 'doctor' };
  }

  // Assistente do médico responsável: só com permissão can_view.
  const assistant = await prisma.doctorAssistant.findFirst({
    where: { assistantUserId: userId, doctorId: patient.doctorId },
  });
  if (assistant) {
    const perms = assistant.permissions as Partial<AssistantPermissions> | null;
    if (perms?.can_view === true) {
      return {
        patientId: patient.id,
        doctorId: patient.doctorId,
        role: 'assistant',
        permissions: {
          can_view: perms.can_view ?? false,
          can_respond: perms.can_respond ?? false,
          can_approve_recipes: perms.can_approve_recipes ?? false,
        },
      };
    }
  }

  return null;
}
