import { z } from 'zod';
import { HEADACHE_TYPES, SYNC_STATUS } from '../constants.js';
import { HEADACHE_PERIODS } from '../headache.js';
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

/**
 * Seleção de localização da dor no wizard (regiões marcadas na frente/verso
 * do mapa da cabeça). Guardado no campo jsonb `location`.
 */
export const headacheLocationSelectionSchema = z.object({
  front: z.array(z.string()).default([]),
  back: z.array(z.string()).default([]),
});
export type HeadacheLocationSelection = z.infer<typeof headacheLocationSelectionSchema>;

/**
 * Payload do wizard "Registrar Crise" (11 passos). Todos os passos são
 * opcionais — apenas `diaryDate` é obrigatório (a crise tem de ter um dia).
 */
export const createHeadacheDiaryInputSchema = z.object({
  diaryDate: isoDateSchema,
  /** Período do início; quando o usuário escolhe "Exato" enviamos também startTime. */
  startPeriod: z.enum(HEADACHE_PERIODS).nullable().optional(),
  /** Hora exata "HH:mm" (opcional, quando o período é "Exato"). */
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/u, 'Hora deve ser HH:mm')
    .nullable()
    .optional(),
  endDateTime: isoDateTimeSchema.nullable().optional(),
  durationMinutes: z.number().int().nonnegative().nullable().optional(),
  /** Intensidade na escala 1-10 (o slider 0..1 é convertido antes de enviar). */
  intensity: z.number().int().min(1).max(10).nullable().optional(),
  types: z.array(z.string()).default([]),
  location: headacheLocationSelectionSchema.default({ front: [], back: [] }),
  symptoms: z.array(z.string()).default([]),
  triggers: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  reliefMethods: z.array(z.string()).default([]),
  impactOnActivities: z.array(z.string()).default([]),
  notes: z.string().max(4000).nullable().optional(),
});
export type CreateHeadacheDiaryInput = z.infer<typeof createHeadacheDiaryInputSchema>;

/** Estatísticas agregadas do Diário de Cefaleia (resposta da API). */
export interface HeadacheStats {
  range: { from: string; to: string; days: number };
  totals: {
    count: number;
    daysWithHeadache: number;
    daysWithMedication: number;
    daysWithout: number;
    percentDaysWithHeadache: number;
  };
  severity: {
    leve: number;
    moderado: number;
    severo: number;
    predominant: 'leve' | 'moderado' | 'severo' | null;
  };
  startOfDay: { madrugada: number; manha: number; tarde: number; noite: number };
  duration: {
    avgMinutes: number | null;
    longestMinutes: number | null;
    shortestMinutes: number | null;
    longestDate: string | null;
    shortestDate: string | null;
  };
  /** Contagem por dia da semana (0=domingo … 6=sábado). */
  weekday: number[];
  frequencyPerWeek: number;
  location: {
    front: Array<{ region: string; count: number }>;
    back: Array<{ region: string; count: number }>;
    sides: { both: number; left: number; right: number };
  };
  triggers: Array<{ name: string; count: number }>;
  medications: Array<{ name: string; count: number }>;
  reliefMethods: Array<{ name: string; count: number }>;
  symptoms: Array<{ name: string; count: number }>;
}

/** Diário de Convulsão. */
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

/**
 * Schema para criar um novo registro de diário de convulsão (wizard mobile / API).
 * Campos obrigatórios: seizureDate, lossOfConsciousness, hospitalVisit,
 * durationMinutes, medicationTakenCorrectly, medicationBrandChanged.
 * hospitalName é obrigatório se hospitalVisit = true.
 * newMedicationBrand é obrigatório se medicationBrandChanged = true.
 */
export const createSeizureDiaryInputSchema = z
  .object({
    seizureDate: isoDateSchema,
    /** Hora exata "HH:mm" (opcional). */
    seizureTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/u, 'Hora deve ser HH:mm')
      .nullable()
      .optional(),
    lossOfConsciousness: z.boolean(),
    hospitalVisit: z.boolean(),
    hospitalName: z.string().max(200).nullable().optional(),
    durationMinutes: z.number().int().nonnegative(),
    medicationTakenCorrectly: z.boolean(),
    medicationBrandChanged: z.boolean(),
    newMedicationBrand: z.string().max(200).nullable().optional(),
    additionalNotes: z.string().max(4000).nullable().optional(),
  })
  .refine((data) => (data.hospitalVisit ? Boolean(data.hospitalName) : true), {
    message: 'Informe o nome do hospital quando hospitalVisit for verdadeiro.',
    path: ['hospitalName'],
  })
  .refine((data) => (data.medicationBrandChanged ? Boolean(data.newMedicationBrand) : true), {
    message: 'Informe a nova marca da medicação quando medicationBrandChanged for verdadeiro.',
    path: ['newMedicationBrand'],
  });
export type CreateSeizureDiaryInput = z.infer<typeof createSeizureDiaryInputSchema>;

/** Estatísticas agregadas do Diário de Convulsão (resposta da API). */
export interface SeizureStats {
  range: { from: string; to: string; days: number };
  totals: {
    /** Total de crises registradas no período. */
    count: number;
    /** Dias com pelo menos uma crise. */
    daysWithSeizure: number;
    /** Percentual de dias com crise. */
    percentDaysWithSeizure: number;
  };
  frequencyPerWeek: number;
  consciousness: {
    /** Crises com perda de consciência. */
    withLoss: number;
    /** Crises sem perda de consciência. */
    withoutLoss: number;
    /** Percentual de crises com perda de consciência. */
    percentWithLoss: number;
  };
  hospital: {
    /** Crises que resultaram em visita hospitalar. */
    visited: number;
    /** Crises sem visita hospitalar. */
    notVisited: number;
    /** Percentual de visitas hospitalares. */
    percentVisited: number;
    /** Hospitais mais citados. */
    mostCited: Array<{ name: string; count: number }>;
  };
  medication: {
    /** Crises onde a medicação foi tomada corretamente. */
    takenCorrectly: number;
    /** Crises onde a medicação não foi tomada corretamente. */
    notTaken: number;
    /** Percentual de medicação tomada corretamente. */
    percentCorrect: number;
  };
  brandChange: {
    /** Crises após mudança de marca. */
    changed: number;
    /** Crises sem mudança de marca. */
    notChanged: number;
    /** Marcas mais citadas nas mudanças. */
    topBrands: Array<{ name: string; count: number }>;
  };
  duration: {
    /** Duração média em minutos. */
    avgMinutes: number | null;
    /** Maior duração em minutos. */
    longestMinutes: number | null;
    /** Menor duração em minutos. */
    shortestMinutes: number | null;
    /** Data da crise mais longa. */
    longestDate: string | null;
    /** Data da crise mais curta. */
    shortestDate: string | null;
  };
  /** Contagem por dia da semana (0=domingo … 6=sábado). */
  weekday: number[];
  /** Gatilhos mais comuns. */
  triggers: Array<{ name: string; count: number }>;
  /** Sintomas de aura mais comuns. */
  auraSymptoms: Array<{ name: string; count: number }>;
}
