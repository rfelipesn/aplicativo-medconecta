import { z } from 'zod';
import {
  HEALTH_EVENT_TYPES,
  INPUT_TYPES,
  SYNC_STATUS,
  BUSINESS_RULES,
} from '../constants.js';
import { uuidSchema, isoDateTimeSchema } from './common.js';

/** Anotar Sintoma ou Crise (offline-first). */
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

export const createHealthEventInputSchema = z
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
export type CreateHealthEventInput = z.infer<typeof createHealthEventInputSchema>;
