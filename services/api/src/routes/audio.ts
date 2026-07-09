import type { FastifyInstance } from 'fastify';
import { authenticate, resolveChatAccess } from '../middleware/auth.js';
import { createSignedUploadUrl, createSignedDownloadUrl } from '../lib/storage.js';

interface PatientParams {
  patientId: string;
}

interface UploadBody {
  filename: string;
  mimeType: string;
}

/**
 * Gera URLs assinadas para upload/download de áudio.
 * O mobile faz PUT direto no Supabase Storage com a signedUrl.
 */
export async function registerAudioRoutes(app: FastifyInstance) {
  app.post<{ Params: PatientParams; Body: UploadBody }>(
    '/patients/:patientId/audio/upload-url',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      try {
        const path = `${access.patientId}/${Date.now()}_${request.body.filename}`;
        const { signedUrl } = await createSignedUploadUrl('audios', path);
        const downloadUrl = await createSignedDownloadUrl('audios', path, 86400);
        return { signedUrl, downloadUrl, path };
      } catch (err) {
        app.log.error({ err }, 'audio upload url failed');
        return reply.code(500).send({ error: 'storage_error' });
      }
    },
  );
}
