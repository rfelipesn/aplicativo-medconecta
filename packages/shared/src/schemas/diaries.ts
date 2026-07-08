import { z } from 'zod';
import { HEADACHE_TYPES, SYNC_STATUS } from '../constants.js';
import { uuidSchema, isoDateSchema, isoDateTimeSchema } from './common.js';

/** Diário de Cefaleia (questionário de 11 etapas). */
export const headacheLocationSchema = z.object({
  frontal: z.boolean().default(false),
  temporal: z.boolean().default(false),
  occipital: z.boolean().default(false),
  bilateral: z.boolean().default(false),
  counts: z.record(z.string(), z.number().int().nonnegative()).default({}),
});

export const headacheDiarySchema = z.object({
  id: uuidSchema,
  patientId: uuidSchema,
  diaryDate: isoDateSchema,
  startTime: z.string().nullable().optional(),
  endTime: isoDateTimeSchema.nullable().optional(),
  durationMinutes: z.number().int().nonnegative().nullable().optional(),
  intensity: z.number().int().min(1).max(10).nullable().optional(),
  types: z.array(z.enum(HEADACHE_TYPES)).default([]),
  location: headacheLocationSchema.default({
    frontal: false,
    temporal: false,
    occipital: false,
    bilateral: false,
    counts: {},
  }),
  symptoms: z.array(z.string()).default([]),
  triggers: z.array(z.string()).default([]),
  medicationsTaken: z
    .array(z.object({ name: z.string(), timestamp: isoDateTimeSchema.optional() }))
    .default([]),
  reliefMethods: z.array(z.string()).default([]),
  impactOnActivities: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
  syncStatus: z.enum(SYNC_STATUS).default('pending'),
});
export type HeadacheDiary = z.infer<typeof headacheDiarySchema>;

/** Diário de Epilepsia. */
export const seizureDiarySchema = z
  .object({
    id: uuidSchema,
    patientId: uuidSchema,
    seizureDate: isoDateSchema,
    seizureTime: z.string().nullable().optional(),
    lossOfConsciousness: z.boolean(),
    hospitalVisit: z.boolean(),
    hospitalName: z.string().nullable().optional(),
    durationMinutes: z.number().int().nonnegative(),
    medicationTakenCorrectly: z.boolean(),
    medicationBrandChanged: z.boolean(),
    newMedicationBrand: z.string().nullable().optional(),
    additionalNotes: z.string().nullable().optional(),
    syncStatus: z.enum(SYNC_STATUS).default('pending'),
  })
  .refine((data) => (data.hospitalVisit ? Boolean(data.hospitalName) : true), {
    message: 'Informe o nome do hospital quando hospitalVisit for verdadeiro.',
    path: ['hospitalName'],
  })
  .refine((data) => (data.medicationBrandChanged ? Boolean(data.newMedicationBrand) : true), {
    message: 'Informe a nova marca quando medicationBrandChanged for verdadeiro.',
    path: ['newMedicationBrand'],
  });
export type SeizureDiary = z.infer<typeof seizureDiarySchema>;
