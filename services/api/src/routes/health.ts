import type { FastifyInstance } from 'fastify';
import { prisma } from '@medconecta/db';

export async function registerHealthRoutes(app: FastifyInstance) {
  // Liveness: o processo está de pé (não toca no banco).
  app.get('/health', async () => ({
    status: 'ok',
    service: 'medconecta-api',
    timestamp: new Date().toISOString(),
  }));

  // Readiness: a API consegue falar com o Postgres (Supabase via pooler)?
  app.get('/ready', async (_request, reply) => {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        db: 'up',
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      app.log.error({ err }, 'readiness check failed');
      return reply.code(503).send({
        status: 'not_ready',
        db: 'down',
        latencyMs: Date.now() - start,
      });
    }
  });

  // Contagens por tabela — prova que os models do Prisma batem com o schema real.
  // Roda como role `postgres` (BYPASSRLS), portanto enxerga todas as linhas.
  app.get('/stats', async (_request, reply) => {
    try {
      const [users, doctors, patients, recipeRequests, examUploads] =
        await Promise.all([
          prisma.user.count(),
          prisma.doctor.count(),
          prisma.patient.count(),
          prisma.recipeRequest.count(),
          prisma.examUpload.count(),
        ]);

      return {
        ok: true,
        counts: { users, doctors, patients, recipeRequests, examUploads },
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      app.log.error({ err }, 'stats query failed');
      return reply.code(500).send({ ok: false, error: 'stats_failed' });
    }
  });
}
