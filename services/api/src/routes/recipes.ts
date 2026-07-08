import type { FastifyInstance } from 'fastify';
import { BUSINESS_RULES } from '@medconecta/shared';

/**
 * Jobs do SLA burocrático de receita (72h). NÃO é fluxo clínico.
 * O médico responde anexando o PDF da receita (sem integração de terceiros no MVP).
 *
 * Este endpoint é pensado para ser chamado por um cron (ex.: Supabase scheduled
 * function ou cron externo) para marcar como 'expired' e lembrar o médico.
 */
export async function registerRecipeRoutes(app: FastifyInstance) {
  app.get('/recipes/sla/check', async () => {
    // TODO (Fase 1): consultar recipe_requests com status 'pending' e:
    //  - status -> 'expired' quando now() > sla_deadline
    //  - notificar o médico quando faltarem REMINDER horas
    return {
      ok: true,
      slaHours: BUSINESS_RULES.RECIPE_SLA_HOURS,
      reminderHours: BUSINESS_RULES.RECIPE_REMINDER_HOURS,
      note: 'stub: implementar verificação de prazos na Fase 1',
    };
  });
}
