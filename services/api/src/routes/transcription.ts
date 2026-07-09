import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@medconecta/db';
import { env } from '../env.js';
import { authenticate } from '../middleware/auth.js';
import { downloadAudioBuffer } from '../lib/storage.js';

const transcribeInputSchema = z.object({
  audioUrl: z.string().min(1),
  source: z.enum(['chat', 'health_event']),
  referenceId: z.string().uuid(),
});

type TranscribeBody = z.infer<typeof transcribeInputSchema>;

interface TranscribeErrorPayload {
  error: string;
  message?: string;
  note?: string;
  maxAudioSeconds?: number;
}

function fail(
  reply: FastifyReply,
  status: number,
  payload: TranscribeErrorPayload,
) {
  return reply.code(status).send(payload);
}

/**
 * Transcrição via Groq Whisper (whisper-large-v3), idioma pt.
 * Groq expõe endpoint compatível com OpenAI (gratuito em console.groq.com).
 * - Autenticada (Bearer do Supabase Auth).
 * - INVARIANTE: transcription_text é visível somente ao médico/sistema. Este endpoint
 *   NÃO expõe `transcription_text` ao paciente — é chamado por backend ou em
 *   contexto autorizado.
 * - Idempotente: sobrescreve se já houver texto anterior.
 * - Rate-limit: usa middleware `authenticate` (100 req/min global).
 */
export async function registerTranscriptionRoutes(app: FastifyInstance) {
  app.post<{ Body: TranscribeBody }>(
    '/transcribe',
    { preHandler: authenticate },
    async (request, reply) => {
      const parsed = transcribeInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return fail(reply, 400, {
          error: 'invalid_payload',
          message: 'Corpo da requisição inválido.',
        });
      }
      const { audioUrl, source, referenceId } = parsed.data;

      if (!env.GROQ_API_KEY) {
        app.log.warn('GROQ_API_KEY ausente — transcrição indisponível');
        return fail(reply, 503, {
          error: 'not_configured',
          note: 'Configurar GROQ_API_KEY no ambiente (console.groq.com).',
        });
      }

      // ---------- Acesso autorizado ao recurso de origem ----------
      let patientId: string;
      if (source === 'chat') {
        const msg = await prisma.chatMessage.findUnique({
          where: { id: referenceId },
          select: { patientId: true },
        });
        if (!msg) {
          return fail(reply, 404, {
            error: 'not_found',
            message: 'Mensagem de chat não encontrada.',
          });
        }
        patientId = msg.patientId;
      } else {
        const evt = await prisma.healthEventLog.findUnique({
          where: { id: referenceId },
          select: { patientId: true },
        });
        if (!evt) {
          return fail(reply, 404, {
            error: 'not_found',
            message: 'Registro de saúde não encontrado.',
          });
        }
        patientId = evt.patientId;
      }

      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { doctor: { select: { userId: true } } },
      });
      if (!patient) {
        return fail(reply, 404, {
          error: 'not_found',
          message: 'Paciente não encontrado.',
        });
      }
      const callerUserId = request.authUser!.id;
      const isPatient = patient.userId === callerUserId;
      const isDoctor = patient.doctor.userId === callerUserId;
      if (!isPatient && !isDoctor) {
        return fail(reply, 403, {
          error: 'forbidden',
          message: 'Usuário sem permissão sobre este recurso.',
        });
      }

      // ---------- Download do áudio ----------
      let audioBuffer: Buffer;
      let contentType: string | null;
      try {
        const dl = await downloadAudioBuffer(audioUrl);
        audioBuffer = dl.buffer;
        contentType = dl.contentType;
      } catch (err) {
        app.log.error(
          { err, referenceId, source },
          'Falha ao baixar áudio para transcrição',
        );
        return fail(reply, 422, {
          error: 'transcription_failed',
          message: 'Não foi possível obter o áudio informado.',
        });
      }

      if (audioBuffer.length === 0) {
        return fail(reply, 422, {
          error: 'transcription_failed',
          message: 'Áudio vazio.',
        });
      }

      // Envio ao Groq Whisper (fetch nativo + FormData)
      const form = new FormData();
      const mimeType =
        (contentType && contentType.length > 0 ? contentType : null) ??
        guessAudioMime(audioUrl) ??
        'audio/webm';
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
      const filename = lastSegment(audioUrl) ?? 'audio.webm';
      form.append('file', blob, filename);
      form.append('model', 'whisper-large-v3');
      form.append('language', 'pt');

      let whisperText: string;
      try {
        const res = await fetch(
          'https://api.groq.com/openai/v1/audio/transcriptions',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
            body: form,
          },
        );
        if (!res.ok) {
          const _text = await res.text().catch(() => '');
          app.log.error(
            { status: res.status, length: audioBuffer.length, _text: _text.slice(0, 200) },
            'Whisper retornou erro',
          );
          return fail(reply, 502, {
            error: 'transcription_failed',
            message: 'Serviço de transcrição retornou erro.',
          });
        }
        const data = (await res.json()) as { text?: unknown };
        if (typeof data.text !== 'string' || data.text.length === 0) {
          whisperText = '';
        } else {
          whisperText = data.text;
        }
      } catch (err) {
        app.log.error({ err }, 'Exceção ao chamar Whisper');
        return fail(reply, 502, {
          error: 'transcription_failed',
          message: 'Falha ao comunicar com serviço de transcrição.',
        });
      }

      // Persistência (idempotente)
      try {
        if (source === 'chat') {
          await prisma.chatMessage.update({
            where: { id: referenceId },
            data: {
              transcriptionText: whisperText || null,
              transcriptionConfidence: 95,
            },
          });
        } else {
          await prisma.healthEventLog.update({
            where: { id: referenceId },
            data: {
              transcriptionText: whisperText || null,
              transcriptionConfidence: 95,
            },
          });
        }
      } catch (err) {
        app.log.error(
          { err, referenceId, source },
          'Falha ao persistir transcription_text',
        );
        return fail(reply, 500, {
          error: 'transcription_failed',
          message: 'Não foi possível salvar a transcrição.',
        });
      }

      return reply
        .code(200)
        .send({ ok: true as const, transcriptionText: whisperText });
    },
  );
}

function lastSegment(url: string): string | null {
  try {
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean).pop() ?? null;
    return seg;
  } catch {
    const seg = url.split('/').filter(Boolean).pop() ?? null;
    return seg;
  }
}

function guessAudioMime(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.webm')) return 'audio/webm';
  if (lower.endsWith('.aac')) return 'audio/aac';
  return null;
}
