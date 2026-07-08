import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { DEMAND_PRIORITIES } from '@medconecta/shared';

const triageInputSchema = z.object({
  text: z.string().min(1),
});

const triageOutputSchema = z.object({
  priority: z.enum(DEMAND_PRIORITIES),
  isEmergencyFlag: z.boolean(),
  confidence: z.number().min(0).max(100),
});
export type TriageOutput = z.infer<typeof triageOutputSchema>;

/** Red-flags de emergência -> redirecionar ao PS, NUNCA tentar resolver no app. */
const EMERGENCY_KEYWORDS = [
  'não consigo respirar',
  'falta de ar',
  'dor no peito',
  'perda de força',
  'convulsão agora',
  'desmaio',
  'avc',
  'derrame',
];

/**
 * Triagem de demandas ELETIVAS (Fase 2). "urgent" = prioridade dentro do
 * fluxo eletivo, jamais emergência. Camada 1 (regras) abaixo; camada 2
 * (gpt-4o-mini com structured outputs) entra quando OPENAI_API_KEY existir.
 */
export async function registerAiRoutes(app: FastifyInstance) {
  app.post('/ai/triage-demand', async (request, reply) => {
    const parsed = triageInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const text = parsed.data.text.toLowerCase();
    const isEmergencyFlag = EMERGENCY_KEYWORDS.some((kw) => text.includes(kw));

    const result: TriageOutput = {
      priority: isEmergencyFlag ? 'urgent' : 'elective',
      isEmergencyFlag,
      confidence: 60,
    };

    // TODO (Fase 2): se !isEmergencyFlag e baixa confiança, chamar gpt-4o-mini
    // com structured outputs para refinar { priority, isEmergencyFlag, confidence }.
    return result;
  });
}
