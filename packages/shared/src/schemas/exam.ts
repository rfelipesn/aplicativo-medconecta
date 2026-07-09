import { z } from 'zod';
import { EXAM_TYPES, SYNC_STATUS } from '../constants.js';
import { uuidSchema, isoDateSchema } from './common.js';

/** Enviar Exame (foto com guia visual ou upload de arquivo). */
export const examUploadSchema = z.object({
  id: uuidSchema,
  patientId: uuidSchema,
  doctorId: uuidSchema,
  examType: z.enum(EXAM_TYPES),
  examDate: isoDateSchema.nullable().optional(),
  fileUrl: z.string(),
  fileMimeType: z.string(),
  fileSize: z.number().int().nonnegative(),
  userNotes: z.string().nullable().optional(),
  syncStatus: z.enum(SYNC_STATUS).default('pending'),
});
export type ExamUpload = z.infer<typeof examUploadSchema>;

export const ACCEPTED_EXAM_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export const createExamUploadInputSchema = z.object({
  examType: z.enum(EXAM_TYPES),
  examDate: isoDateSchema.optional(),
  fileMimeType: z.enum(ACCEPTED_EXAM_MIME_TYPES),
  userNotes: z.string().max(1000).optional(),
  localFilePath: z.string(),
});
export type CreateExamUploadInput = z.infer<typeof createExamUploadInputSchema>;

/** Requisição de URL assinada para upload (enviada pelo front antes do PUT no Storage). */
export const signUploadInputSchema = z.object({
  examType: z.enum(EXAM_TYPES),
  filename: z.string().min(1).max(200),
  mimeType: z.enum(ACCEPTED_EXAM_MIME_TYPES),
});
export type SignUploadInput = z.infer<typeof signUploadInputSchema>;

/** Registro do exame no banco APÓS o upload bem-sucedido no Storage. */
export const registerExamInputSchema = z.object({
  storagePath: z.string().min(1),
  examType: z.enum(EXAM_TYPES),
  examDate: isoDateSchema.optional(),
  fileMimeType: z.enum(ACCEPTED_EXAM_MIME_TYPES),
  fileSize: z.number().int().positive(),
  userNotes: z.string().max(1000).optional(),
});
export type RegisterExamInput = z.infer<typeof registerExamInputSchema>;
