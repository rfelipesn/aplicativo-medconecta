import { z } from 'zod';
import {
  HEALTH_EVENT_TYPES,
  INPUT_TYPES,
  SYNC_STATUS,
  BUSINESS_RULES,
} from '../constants.js';
import { uuidSchema, isoDateTimeSchema } from './common.js';

/** Schema completo persistido (espelha `health_event_logs` no Postgres). */
export const healthEventLogSchema = z.object({
  id: uuidSchema,
  patientId: uuidSchema,
  eventType: z.enum(HEALTH_EVENT_TYPES),
  inputType: z.enum(INPUT_TYPES),
  descriptionText: z.string().nullable().optional(),
  audioUrl: z.string().nullable().optional(),
  /** Visível APENAS ao médico. */
  transcriptionText: z.string().nullable().optional(),
  transcriptionConfidence: z.number().min(0).max(100).nullable().optional(),
  eventDatetime: isoDateTimeSchema,
  syncStatus: z.enum(SYNC_STATUS).default('pending'),
});
export type HealthEventLog = z.infer<typeof healthEventLogSchema>;

/**
 * Input para a rota POST /patients/:patientId/health-events (web e mobile).
 *
 * Diferente do `createHealthEventInputSchema` offline-first (com `localAudioPath`),
 * esta rota recebe o payload já sincronizado: ou `descriptionText` ou `audioUrl`.
 */
export const createHealthEventInputSchema = z.object({
  eventType: z.enum(HEALTH_EVENT_TYPES),
  inputType: z.enum(INPUT_TYPES).default('text'),
  descriptionText: z.string().min(1).max(2000),
  audioUrl: z.string().url().optional(),
  eventDatetime: z.string(),
});
export type CreateHealthEventInput = z.infer<typeof createHealthEventInputSchema>;

/** Input original offline-first, mantido para compatibilidade com WatermelonDB. */
export const createOfflineHealthEventInputSchema = z
  .object({
    eventType: z.enum(HEALTH_EVENT_TYPES),
    inputType: z.enum(INPUT_TYPES),
    descriptionText: z.string().max(4000).optional(),
    localAudioPath: z.string().optional(),
    audioDurationSeconds: z
      .number()
      .positive()
      .max(BUSINESS_RULES.AUDIO_MAX_DURATION_SECONDS)
      .optional(),
    eventDatetime: isoDateTimeSchema,
  })
  .refine(
    (data) =>
      data.inputType === 'text'
        ? Boolean(data.descriptionText?.trim())
        : Boolean(data.localAudioPath),
    { message: 'Texto exige descriptionText; áudio exige localAudioPath.' },
  );
export type CreateOfflineHealthEventInput = z.infer<typeof createOfflineHealthEventInputSchema>;

/** Estatísticas agregadas de eventos de saúde do paciente. */
export interface HealthEventStats {
  range: { from: string; to: string; days: number };
  totals: { count: number; distinctDays: number; averagePerWeek: number };
  byType: Array<{ type: string; count: number; percent: number }>;
  weekday: number[];
  topDescriptions: Array<{ text: string; count: number }>;
}
