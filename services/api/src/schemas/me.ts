import { z } from 'zod';

/**
 * Payload para troca de senha obrigatória no 1º acesso do paciente.
 * PIN numérico de 6 dígitos ou senha alfanumérica de pelo menos 8 caracteres.
 */
export const changePasswordInputSchema = z.object({
  newPassword: z.union([
    z.string().regex(/^\d{6}$/, 'PIN deve ter 6 dígitos'),
    z.string().min(8, 'Senha deve ter ao menos 8 caracteres').max(72),
  ]),
});
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
