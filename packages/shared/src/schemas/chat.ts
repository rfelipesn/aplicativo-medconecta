import { z } from 'zod';
import { MESSAGE_TYPES, SENDER_TYPES, SYNC_STATUS, BUSINESS_RULES } from '../constants.js';
import { uuidSchema, isoDateTimeSchema } from './common.js';

export const chatMessageSchema = z.object({
  id: uuidSchema,
  patientId: uuidSchema,
  doctorId: uuidSchema,
  senderType: z.enum(SENDER_TYPES),
  messageType: z.enum(MESSAGE_TYPES),
  contentText: z.string().nullable().optional(),
  audioUrl: z.string().nullable().optional(),
  /** Visível APENAS ao médico. Nunca exposta ao paciente. */
  transcriptionText: z.string().nullable().optional(),
  transcriptionConfidence: z.number().min(0).max(100).nullable().optional(),
  isRead: z.boolean().default(false),
  readAt: isoDateTimeSchema.nullable().optional(),
  syncStatus: z.enum(SYNC_STATUS).default('pending'),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** Mensagem enviada pelo paciente (texto OU áudio com limite de duração). */
export const sendMessageInputSchema = z
  .object({
    messageType: z.enum(MESSAGE_TYPES),
    contentText: z.string().max(4000).optional(),
    audioDurationSeconds: z
      .number()
      .positive()
      .max(BUSINESS_RULES.AUDIO_MAX_DURATION_SECONDS)
      .optional(),
    localAudioPath: z.string().optional(),
  })
  .refine(
    (data) =>
      data.messageType === 'text'
        ? Boolean(data.contentText?.trim())
        : Boolean(data.localAudioPath),
    { message: 'Mensagem de texto exige contentText; áudio exige localAudioPath.' },
  );
export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

/**
 * Envio de mensagem aceito pela API (MVP: somente texto).
 * Áudio + transcrição entram na Fase 2 (Whisper).
 */
export const postChatMessageInputSchema = z.object({
  messageType: z.literal('text').default('text'),
  contentText: z.string().min(1, 'Mensagem vazia.').max(4000),
});
export type PostChatMessageInput = z.infer<typeof postChatMessageInputSchema>;
