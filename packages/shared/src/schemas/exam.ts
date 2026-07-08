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
