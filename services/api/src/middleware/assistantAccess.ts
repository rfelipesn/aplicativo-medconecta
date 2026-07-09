import type { FastifyRequest } from 'fastify';
import { prisma } from '@medconecta/db';
import type { AssistantPermissions } from '@medconecta/shared';

export interface AssistantAccess {
  permissions: AssistantPermissions;
  isAssistant: true;
  doctorId: string;
  patientId: string;
  assistantUserId: string;
  doctorAssistantId: string;
}

const DEFAULT_PERMISSIONS: AssistantPermissions = {
  can_view: false,
  can_respond: false,
  can_approve_recipes: false,
};

function isAssistantPermissions(value: unknown): value is AssistantPermissions {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.can_view === 'boolean' &&
    typeof v.can_respond === 'boolean' &&
    typeof v.can_approve_recipes === 'boolean'
  );
}

/**
 * Verifica se o usuário autenticado é assistente do médico responsável
 * pelo `patientId`. Retorna o contexto de permissões ou `null` se:
 *  - não houver usuário autenticado,
 *  - o paciente não existir,
 *  - o usuário não estiver vinculado como assistente daquele médico.
 */
export async function resolveAssistantAccess(
  request: FastifyRequest,
  patientId: string,
): Promise<AssistantAccess | null> {
  const userId = request.authUser?.id;
  if (!userId) return null;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, doctorId: true },
  });
  if (!patient) return null;

  const assistant = await prisma.doctorAssistant.findFirst({
    where: { assistantUserId: userId, doctorId: patient.doctorId },
  });
  if (!assistant) return null;

  const permissions: AssistantPermissions = isAssistantPermissions(assistant.permissions)
    ? assistant.permissions
    : DEFAULT_PERMISSIONS;

  return {
    permissions,
    isAssistant: true,
    doctorId: patient.doctorId,
    patientId: patient.id,
    assistantUserId: userId,
    doctorAssistantId: assistant.id,
  };
}
