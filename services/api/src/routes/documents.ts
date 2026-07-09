import type { FastifyInstance } from 'fastify';
import {
  signDocumentUploadInputSchema,
  createDocumentInputSchema,
} from '@medconecta/shared';
import { prisma } from '@medconecta/db';
import { authenticate, resolveChatAccess } from '../middleware/auth.js';
import {
  createSignedUploadUrl,
  createSignedDownloadUrl,
  deleteStorageObject,
} from '../lib/storage.js';
import { auditLog } from '../lib/audit.js';

// Bucket do Supabase Storage destinado aos documentos (receitas, prescrições,
// laudos, resultados de exame em PDF). O bucket deve ser criado manualmente no
// console do Supabase — o código funciona normalmente mesmo sem o bucket pré-existente
// para a rota de sign-upload (o erro só aparece no PUT real no Storage).
const BUCKET = 'documents';

interface PatientParams {
  patientId: string;
}
interface DocumentParams {
  patientId: string;
  documentId: string;
}

/**
 * Fluxo de upload de documentos (receitas assinadas, prescrições, laudos,
 * resultados de exame em PDF):
 *  1. Front solicita URL assinada  → POST /patients/:id/documents/sign-upload
 *  2. Front faz PUT direto no Supabase Storage com a signed URL
 *  3. Front registra no banco      → POST /patients/:id/documents
 *  4. Médico/paciente acessa URL    → GET  /patients/:id/documents/:documentId/download-url
 */
export async function registerDocumentRoutes(app: FastifyInstance) {
  // 1. Gerar signed upload URL
  app.post<{ Params: PatientParams }>(
    '/patients/:patientId/documents/sign-upload',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const parsed = signDocumentUploadInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
      }

      const { documentType, filename, mimeType } = parsed.data;
      const ext = filename.includes('.') ? filename.split('.').pop() : 'bin';
      const storagePath = `${access.patientId}/${documentType}/${Date.now()}.${ext}`;

      const signed = await createSignedUploadUrl(BUCKET, storagePath);
      return { signedUrl: signed.signedUrl, storagePath, mimeType };
    },
  );

  // 2. Registrar no banco após upload bem-sucedido
  app.post<{ Params: PatientParams }>(
    '/patients/:patientId/documents',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const parsed = createDocumentInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
      }

      const { storagePath, documentType, fileName, fileSize, mimeType } = parsed.data;

      const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;

      const document = await prisma.document.create({
        data: {
          patientId: access.patientId,
          doctorId: access.doctorId,
          documentType,
          fileUrl,
          fileName,
          fileSize,
          mimeType,
          uploadedByDoctor: access.role === 'doctor',
          createdBy: request.authUser?.id ?? null,
        },
      });

      await auditLog({
        userId: request.authUser?.id,
        resourceType: 'document',
        resourceId: document.id,
        action: access.role === 'doctor' ? 'document_upload_doctor' : 'document_upload_patient',
        ipAddress: (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? request.ip,
      });

      return reply.code(201).send({ ok: true, document });
    },
  );

  // 3. Listar documentos de um paciente
  app.get<{ Params: PatientParams }>(
    '/patients/:patientId/documents',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const documents = await prisma.document.findMany({
        where: { patientId: access.patientId },
        orderBy: { createdAt: 'desc' },
      });
      return { documents };
    },
  );

  // 4. Gerar signed download URL (válida por 1h)
  app.get<{ Params: DocumentParams }>(
    '/patients/:patientId/documents/:documentId/download-url',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const document = await prisma.document.findUnique({
        where: { id: request.params.documentId },
      });
      if (!document || document.patientId !== access.patientId) {
        return reply.code(404).send({ error: 'not_found' });
      }

      const storagePrefix = `${process.env.SUPABASE_URL}/storage/v1/object/${BUCKET}/`;
      const storagePath = document.fileUrl.replace(storagePrefix, '');

      const signedUrl = await createSignedDownloadUrl(BUCKET, storagePath, 3600);
      return { signedUrl, expiresInSeconds: 3600 };
    },
  );

  // 5. Remover documento (somente médico)
  app.delete<{ Params: DocumentParams }>(
    '/patients/:patientId/documents/:documentId',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });
      if (access.role !== 'doctor') return reply.code(403).send({ error: 'forbidden' });

      const document = await prisma.document.findUnique({
        where: { id: request.params.documentId },
      });
      if (!document || document.patientId !== access.patientId) {
        return reply.code(404).send({ error: 'not_found' });
      }

      const storagePrefix = `${process.env.SUPABASE_URL}/storage/v1/object/${BUCKET}/`;
      const storagePath = document.fileUrl.replace(storagePrefix, '');

      await prisma.document.delete({ where: { id: document.id } });
      await deleteStorageObject(BUCKET, storagePath);

      await auditLog({
        userId: request.authUser?.id,
        resourceType: 'document',
        resourceId: document.id,
        action: 'document_delete',
        ipAddress: (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? request.ip,
      });

      return { ok: true };
    },
  );
}
