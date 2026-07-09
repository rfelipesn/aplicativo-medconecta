import type { FastifyInstance } from 'fastify';
import { signUploadInputSchema, registerExamInputSchema } from '@medconecta/shared';
import { prisma } from '@medconecta/db';
import { authenticate, resolveChatAccess } from '../middleware/auth.js';
import { createSignedUploadUrl, createSignedDownloadUrl } from '../lib/storage.js';

const BUCKET = 'exams';

interface PatientParams { patientId: string }
interface ExamParams { patientId: string; examId: string }

/**
 * Fluxo de upload de exames (PDF / imagem):
 *  1. Front solicita URL assinada  → POST /patients/:id/exams/sign-upload
 *  2. Front faz PUT direto no Supabase Storage com a signed URL
 *  3. Front registra no banco      → POST /patients/:id/exams
 *  4. Médico/paciente acessa URL   → GET  /patients/:id/exams/:examId/download-url
 */
export async function registerExamRoutes(app: FastifyInstance) {
  // 1. Gerar signed upload URL
  app.post<{ Params: PatientParams }>(
    '/patients/:patientId/exams/sign-upload',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const parsed = signUploadInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
      }

      const { examType, filename, mimeType } = parsed.data;
      const ext = filename.includes('.') ? filename.split('.').pop() : 'bin';
      const storagePath = `${access.patientId}/${examType}/${Date.now()}.${ext}`;

      const signed = await createSignedUploadUrl(BUCKET, storagePath);
      return { signedUrl: signed.signedUrl, storagePath, mimeType };
    },
  );

  // 2. Registrar no banco após upload bem-sucedido
  app.post<{ Params: PatientParams }>(
    '/patients/:patientId/exams',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const parsed = registerExamInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
      }
      const { storagePath, examType, examDate, fileMimeType, fileSize, userNotes } = parsed.data;

      // Gera URL pública (sem expiração imediata) para armazenar na tabela.
      // URLs de download real são geradas sob demanda via /download-url.
      const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;

      const exam = await prisma.examUpload.create({
        data: {
          patientId: access.patientId,
          doctorId: access.doctorId,
          examType,
          examDate: examDate ? new Date(examDate) : null,
          fileUrl,
          fileMimeType,
          fileSize,
          userNotes: userNotes ?? null,
          syncStatus: 'synced',
        },
      });

      return reply.code(201).send({ exam, storagePath });
    },
  );

  // 3. Listar exames de um paciente
  app.get<{ Params: PatientParams }>(
    '/patients/:patientId/exams',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const exams = await prisma.examUpload.findMany({
        where: { patientId: access.patientId },
        orderBy: { uploadedAt: 'desc' },
      });
      return { exams };
    },
  );

  // 4. Gerar signed download URL (válida por 1h)
  app.get<{ Params: ExamParams }>(
    '/patients/:patientId/exams/:examId/download-url',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const exam = await prisma.examUpload.findUnique({
        where: { id: request.params.examId },
      });
      if (!exam || exam.patientId !== access.patientId) {
        return reply.code(404).send({ error: 'not_found' });
      }

      // Extrai o storagePath a partir da fileUrl armazenada.
      const storagePrefix = `${process.env.SUPABASE_URL}/storage/v1/object/${BUCKET}/`;
      const storagePath = exam.fileUrl.replace(storagePrefix, '');

      const signedUrl = await createSignedDownloadUrl(BUCKET, storagePath, 3600);
      return { signedUrl, expiresInSeconds: 3600 };
    },
  );
}
