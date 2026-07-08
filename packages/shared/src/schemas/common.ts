import { z } from 'zod';

/** Primitivos reutilizáveis. */
export const uuidSchema = z.string().uuid();

/** CPF: 11 dígitos (validação estrutural; dígito verificador pode ser checado no backend). */
export const cpfSchema = z
  .string()
  .regex(/^\d{11}$/u, 'CPF deve conter 11 dígitos numéricos');

/** Telefone BR em formato E.164 simplificado (ex.: 5583988001234). */
export const phoneSchema = z
  .string()
  .regex(/^55\d{10,11}$/u, 'Telefone deve estar no formato 55DDDNUMERO');

export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Data deve ser YYYY-MM-DD');

/** Campos de timestamp comuns a todas as entidades. */
export const timestampsSchema = z.object({
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

/** Soft delete (LGPD): null = ativo. */
export const softDeleteSchema = z.object({
  deletedAt: isoDateTimeSchema.nullable().default(null),
});
