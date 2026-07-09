import { z } from 'zod';
import { uuidSchema, cpfSchema, phoneSchema } from './common.js';

/**
 * Permissões granulares de um assistente vinculado a um médico.
 * - can_view: pode ler prontuário/chat/diário do paciente.
 * - can_respond: pode responder demandas e enviar mensagens no chat.
 * - can_approve_recipes: pode marcar receitas como respondidas.
 */
export const assistantPermissionsSchema = z.object({
  can_view: z.boolean(),
  can_respond: z.boolean(),
  can_approve_recipes: z.boolean(),
});
export type AssistantPermissions = z.infer<typeof assistantPermissionsSchema>;

export const DEFAULT_ASSISTANT_PERMISSIONS: AssistantPermissions = {
  can_view: true,
  can_respond: false,
  can_approve_recipes: false,
};

/** Médico cria um novo assistente (vincula um User já existente com role='assistant'). */
export const createAssistantInputSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  cpf: cpfSchema,
  phone: phoneSchema,
  initialPassword: z
    .string()
    .min(8, 'Senha inicial deve ter ao menos 8 caracteres')
    .max(72),
  permissions: assistantPermissionsSchema
    .partial()
    .transform((p) => ({ ...DEFAULT_ASSISTANT_PERMISSIONS, ...p }))
    .optional(),
});
export type CreateAssistantInput = z.infer<typeof createAssistantInputSchema>;

/** Atualização das permissões de um assistente já vinculado. */
export const updateAssistantPermissionsInputSchema = z.object({
  permissions: assistantPermissionsSchema,
});
export type UpdateAssistantPermissionsInput = z.infer<
  typeof updateAssistantPermissionsInputSchema
>;

/** Resposta da API para GET /assistants. */
export const assistantSchema = z.object({
  id: uuidSchema,
  doctorId: uuidSchema,
  assistantUserId: uuidSchema,
  permissions: assistantPermissionsSchema,
  createdAt: z.string(),
  user: z.object({
    id: uuidSchema,
    fullName: z.string(),
    email: z.string().email().nullable(),
    phone: z.string(),
    cpf: z.string(),
  }),
});
export type Assistant = z.infer<typeof assistantSchema>;
