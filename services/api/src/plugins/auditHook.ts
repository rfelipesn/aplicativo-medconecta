import type { FastifyInstance, FastifyRequest } from 'fastify';
import { auditLog } from '../lib/audit.js';

/**
 * Rotas que devem ser auditadas automaticamente.
 * Usa a URL da rota (com parâmetros como :id) como chave.
 */
const AUDITED_ROUTES: Record<string, { resourceType: string; action: string }> = {
  'POST /auth/login':           { resourceType: 'session', action: 'login_doctor' },
  'POST /auth/login/patient':   { resourceType: 'session', action: 'login_patient' },
  'POST /auth/register/doctor': { resourceType: 'user',    action: 'register_doctor' },
  'POST /patients':             { resourceType: 'patient', action: 'create_patient' },
  'GET /patients':              { resourceType: 'patient', action: 'list_patients' },
  'GET /me':                    { resourceType: 'user',    action: 'view_profile' },
  'GET /patients/:patientId/messages': { resourceType: 'chat', action: 'list_messages' },
  'POST /patients/:patientId/recipes': { resourceType: 'recipe', action: 'create_recipe' },
  'PATCH /recipes/:recipeId/respond':  { resourceType: 'recipe', action: 'respond_recipe' },
  'GET /patients/:patientId/headache-diary/stats': { resourceType: 'headache_diary', action: 'view_stats' },
};

function routeKey(req: FastifyRequest): string {
  const url = req.routeOptions?.url ?? req.url.split('?')[0];
  return `${req.method} ${url}`;
}

export function registerAuditHook(app: FastifyInstance) {
  app.addHook('onResponse', async (request, reply) => {
    if (reply.statusCode < 200 || reply.statusCode >= 300) return;

    const key = routeKey(request);
    const audit = AUDITED_ROUTES[key];
    if (!audit) return;

    const authUser = (request as unknown as { authUser?: { id?: string } }).authUser;
    const userId = authUser?.id ?? null;
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      request.ip ??
      null;

    await auditLog({
      userId,
      resourceType: audit.resourceType,
      action: audit.action,
      ipAddress: ip,
    });
  });
}
