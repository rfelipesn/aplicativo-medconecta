import { prisma } from '@medconecta/db';

interface AuditParams {
  userId?: string | null;
  resourceType: string;
  resourceId?: string | null;
  action: string;
  ipAddress?: string | null;
}

/**
 * Grava um registro append-only em `audit_logs`.
 * Nunca lança exceção — falha silenciosa para não bloquear a resposta principal.
 */
export async function auditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        resourceType: params.resourceType,
        resourceId: params.resourceId ?? null,
        action: params.action,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch {
    // Audit não pode parar o fluxo principal.
  }
}

/**
 * Registra uma ação executada por um assistente vinculado a um médico.
 * O `action` é prefixado com `assistant_` para permitir consultas de auditoria
 * filtradas por papel (ex.: SELECT * FROM audit_logs WHERE action LIKE 'assistant_%').
 */
export async function logAssistantAction(params: {
  assistantUserId: string;
  resourceType: string;
  resourceId?: string | null;
  action: string;
  ipAddress?: string | null;
}): Promise<void> {
  const prefixed = params.action.startsWith('assistant_')
    ? params.action
    : `assistant_${params.action}`;
  await auditLog({
    userId: params.assistantUserId,
    resourceType: params.resourceType,
    resourceId: params.resourceId ?? null,
    action: prefixed,
    ipAddress: params.ipAddress ?? null,
  });
}

/**
 * Converte uma data ISO (ex: "1989-11-22") para o formato DDMMAAAA (ex: "22111989").
 * Esse valor é usado como senha inicial do paciente.
 */
export function dobToPassword(isoDate: string): string {
  // isoDate: "YYYY-MM-DD"
  const [year, month, day] = isoDate.split('-');
  return `${day}${month}${year}`;
}

/**
 * Gera o e-mail placeholder do paciente baseado no CPF.
 * Formato: `{cpf}@medconecta.local`
 */
export function cpfToEmail(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  // Domínio .app: aceito pelo Supabase Auth sem máscara.
  // O paciente continua usando CPF+data para logar; o email é só identificador
  // interno do Supabase.
  return `paciente-${digits}@app.medconecta.app`;
}
