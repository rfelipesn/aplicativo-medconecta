import { z } from 'zod';
import { DOCUMENT_TYPES } from '../constants.js';

/** Enum de tipos de documento (espelha o enum Prisma `DocumentType`). */
export const documentTypeSchema = z.enum(DOCUMENT_TYPES);

/** MIME types aceitos para upload de documentos. */
export const ACCEPTED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/** Requisição de URL assinada para upload (enviada pelo front antes do PUT no Storage). */
export const signDocumentUploadInputSchema = z.object({
  filename: z.string().min(1).max(200),
  mimeType: z.enum(ACCEPTED_DOCUMENT_MIME_TYPES),
  documentType: documentTypeSchema,
});
export type SignDocumentUploadInput = z.infer<typeof signDocumentUploadInputSchema>;

/** Registro do documento no banco APÓS o upload bem-sucedido no Storage. */
export const createDocumentInputSchema = z.object({
  storagePath: z.string().min(1),
  documentType: documentTypeSchema,
  fileName: z.string().min(1).max(300),
  fileSize: z.number().int().positive(),
  mimeType: z.enum(ACCEPTED_DOCUMENT_MIME_TYPES),
});
export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;
