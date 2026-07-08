import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { BUSINESS_RULES } from '@medconecta/shared';

const transcribeInputSchema = z.object({
  audioUrl: z.string(),
  source: z.enum(['chat', 'health_event']),
  referenceId: z.string().uuid(),
});

/**
 * Transcrição de áudio (Fase 2) via OpenAI Whisper (whisper-1).
 * INVARIANTE: a transcrição é visível APENAS ao médico. O paciente só tem o áudio.
 * Áudios limitados a BUSINESS_RULES.AUDIO_MAX_DURATION_SECONDS.
 */
export async function registerTranscriptionRoutes(app: FastifyInstance) {
  app.post('/transcribe', async (request, reply) => {
    const parsed = transcribeInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    // TODO (Fase 2):
    //  1. Baixar o áudio do Storage (signed URL)
    //  2. Enviar para OpenAI Whisper (mesma OPENAI_API_KEY da triagem)
    //  3. Salvar transcription_text + confidence na linha de origem
    //  4. Processamento idempotente (fila), nunca expor ao paciente
    return reply.code(501).send({
      error: 'not_implemented',
      note: 'Transcrição (Whisper) será implementada na Fase 2.',
      maxAudioSeconds: BUSINESS_RULES.AUDIO_MAX_DURATION_SECONDS,
    });
  });
}
