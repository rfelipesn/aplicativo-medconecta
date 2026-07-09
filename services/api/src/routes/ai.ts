import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { DEMAND_PRIORITIES, DEMAND_TYPES, type DemandType, type DemandPriority } from '@medconecta/shared';
import { env } from '../env.js';

const triageInputSchema = z.object({
  text: z.string().min(1),
  type: z.enum(DEMAND_TYPES).optional(),
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

const SEVERITY_URGENT_KEYWORDS = [
  'muito forte',
  'intenso',
  'constante',
  'não passa',
  'piora',
  'dificuldade',
  'desmaio',
  'vômito',
  'hemorragia',
  'convulsão',
];

const SEVERITY_INFORMATIONAL_KEYWORDS = [
  'dúvida',
  'levei',
  'melhorou',
  'estável',
  'receita',
  'renovação',
  'exame',
  'agendamento',
];

/**
 * Camada 1 — triagem por palavras-chave e regras de tipo.
 * "urgent" = prioridade dentro do fluxo eletivo — NUNCA emergência médica.
 */
function triageLayer1(text: string, type?: DemandType): TriageOutput | null {
  const lower = text.toLowerCase();
  const isEmergencyFlag = EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));

  let priority: DemandPriority | null = null;
  let confidence = 60;

  if (isEmergencyFlag) {
    return { priority: 'urgent', isEmergencyFlag: true, confidence: 85 };
  }

  if (type) {
    switch (type) {
      case 'recipe_renewal':
        priority = 'elective';
        confidence = 75;
        break;
      case 'appointment_request':
        priority = 'elective';
        confidence = 75;
        break;
      case 'exam_result':
        priority = 'elective';
        confidence = 70;
        break;
      case 'second_opinion':
        priority = 'informational';
        confidence = 65;
        break;
      case 'general_question':
        priority = 'informational';
        confidence = 60;
        break;
      case 'symptom_log': {
        const hasUrgent = SEVERITY_URGENT_KEYWORDS.some((kw) => lower.includes(kw));
        const hasInfo = SEVERITY_INFORMATIONAL_KEYWORDS.some((kw) => lower.includes(kw));
        if (hasUrgent) {
          priority = 'urgent';
          confidence = 80;
        } else if (hasInfo) {
          priority = 'informational';
          confidence = 65;
        } else {
          priority = 'elective';
          confidence = 55;
        }
        break;
      }
    }
  }

  if (!priority) {
    const hasUrgent = SEVERITY_URGENT_KEYWORDS.some((kw) => lower.includes(kw));
    if (hasUrgent) priority = 'urgent';
    else priority = 'elective';
    confidence = 50;
  }

  return { priority, isEmergencyFlag, confidence };
}

/**
 * Camada 2 — Groq LLaMA 3.3 70B com structured outputs (quando GROQ_API_KEY existe).
 * Modelo gratuito (llama-3.3-70b-versatile). Refina prioridade/confiança quando a
 * camada 1 tem baixa confiança. API Groq é compatível com OpenAI (só muda URL/key).
 */
async function triageLayer2(text: string, type?: DemandType): Promise<TriageOutput | null> {
  if (!env.GROQ_API_KEY) return null;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Você é um sistema de triagem eletiva de demandas médicas. Responda SOMENTE JSON com: { "priority": "urgent"|"elective"|"informational"|"other", "isEmergencyFlag": boolean, "confidence": number (0-100) }. Lembre: este app NÃO trata emergências — apenas demanda eletiva.',
          },
          {
            role: 'user',
            content: `Tipo da demanda: ${type ?? 'não informado'}.\nTexto: ${text}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const priority = parsed.priority as string;
    if (!['urgent', 'elective', 'informational', 'other'].includes(priority)) return null;

    return {
      priority: priority as DemandPriority,
      isEmergencyFlag: Boolean(parsed.isEmergencyFlag),
      confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 60,
    };
  } catch {
    return null;
  }
}

/**
 * Função pública de triagem. Usada internamente pelas rotas de demanda
 * (chamada direta, sem HTTP). Combina camada 1 (regras) + camada 2 (LLM).
 */
export async function triageDemand(text: string, type?: DemandType): Promise<TriageOutput> {
  const layer1 = triageLayer1(text, type);

  // Se emergência flag detectada na camada 1, retorna direto
  if (layer1?.isEmergencyFlag) return layer1;

  // Se confiança baixa (< 60) e temos GROQ_API_KEY, chama camada 2
  if (layer1 && layer1.confidence < 60 && env.GROQ_API_KEY) {
    const layer2 = await triageLayer2(text, type);
    if (layer2) {
      // Usa o resultado do LLM quando há maior confiança
      return layer2.confidence >= layer1.confidence ? layer2 : layer1;
    }
  }

  return layer1 ?? { priority: 'elective', isEmergencyFlag: false, confidence: 50 };
}

/**
 * Triagem de demandas ELETIVAS (Fase 2). "urgent" = prioridade dentro do
 * fluxo eletivo, NUNCA emergência médica (essas vão para o PS).
 */
export async function registerAiRoutes(app: FastifyInstance) {
  app.post('/ai/triage-demand', async (request, reply) => {
    const parsed = triageInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const { text, type } = parsed.data;
    const result = await triageDemand(text, type);
    return result;
  });
}
