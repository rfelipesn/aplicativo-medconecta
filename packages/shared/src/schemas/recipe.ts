import { z } from 'zod';
import { RECIPE_STATUS, RECIPE_QUANTITY_DAYS } from '../constants.js';
import { uuidSchema, isoDateTimeSchema } from './common.js';

/** Solicitar Nova Receita (SLA burocrático de 72h, nunca clínico). */
export const recipeRequestSchema = z.object({
  id: uuidSchema,
  patientId: uuidSchema,
  doctorId: uuidSchema,
  medicationNames: z.array(z.string()).default([]),
  quantityDays: z
    .union([z.literal(30), z.literal(60), z.literal(90)])
    .nullable()
    .optional(),
  reason: z.string().nullable().optional(),
  status: z.enum(RECIPE_STATUS).default('pending'),
  responseDate: isoDateTimeSchema.nullable().optional(),
  slaDeadline: isoDateTimeSchema,
  /** PDF da receita anexado pelo médico (sem integração de terceiros no MVP). */
  responseDocumentId: uuidSchema.nullable().optional(),
});
export type RecipeRequest = z.infer<typeof recipeRequestSchema>;

export const createRecipeRequestInputSchema = z.object({
  medicationNames: z.array(z.string()).default([]),
  quantityDays: z
    .union([z.literal(RECIPE_QUANTITY_DAYS[0]), z.literal(RECIPE_QUANTITY_DAYS[1]), z.literal(RECIPE_QUANTITY_DAYS[2])])
    .optional(),
  reason: z.string().max(1000).optional(),
});
export type CreateRecipeRequestInput = z.infer<typeof createRecipeRequestInputSchema>;
