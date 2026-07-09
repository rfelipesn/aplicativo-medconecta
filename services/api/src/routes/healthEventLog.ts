import type { FastifyInstance } from 'fastify';
import { createHealthEventInputSchema, type HealthEventStats } from '@medconecta/shared';
import { prisma } from '@medconecta/db';
import { authenticate, resolveChatAccess } from '../middleware/auth.js';
import { auditLog } from '../lib/audit.js';

interface PatientParams {
  patientId: string;
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function countOccurrences(items: string[]): Array<{ text: string; count: number }> {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = item.trim();
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * HealthEventLog — anotações de sintomas gerais (cabeça, sono, convulsão
 * referenciada, sintomas soltos, outros). Diferente do HeadacheDiary/SeizureDiary
 * que têm campos estruturados específicos, este é um log textual/áudio genérico
 * usado pelo fluxo "Anotar Sintoma" do app.
 *
 * Quem registra: o PACIENTE.
 * Quem visualiza: o paciente e o médico responsável.
 */
export async function registerHealthEventRoutes(app: FastifyInstance) {
  // ── Criar evento ──────────────────────────────────────────────────────
  app.post<{ Params: PatientParams }>(
    '/patients/:patientId/health-events',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const parsed = createHealthEventInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
      }
      const input = parsed.data;

      const event = await prisma.healthEventLog.create({
        data: {
          patientId: access.patientId,
          eventType: input.eventType,
          inputType: input.inputType,
          descriptionText: input.descriptionText,
          audioUrl: input.audioUrl ?? null,
          eventDatetime: new Date(input.eventDatetime),
          syncStatus: 'synced',
        },
      });

      await auditLog({
        userId: access.role === 'patient' ? request.authUser?.id : undefined,
        resourceType: 'health_event_log',
        resourceId: event.id,
        action: 'create_health_event',
        ipAddress: request.ip,
      });

      return reply.code(201).send({ ok: true, event });
    },
  );

  // ── Listar eventos do paciente ────────────────────────────────────────
  app.get<{ Params: PatientParams; Querystring: { days?: string } }>(
    '/patients/:patientId/health-events',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const daysParam = request.query.days;
      const where: { patientId: string; eventDatetime?: { gte: Date } } = {
        patientId: access.patientId,
      };
      if (daysParam) {
        const days = Math.max(1, Math.min(365, Number(daysParam) || 30));
        const from = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
        from.setUTCHours(0, 0, 0, 0);
        where.eventDatetime = { gte: from };
      }

      const events = await prisma.healthEventLog.findMany({
        where,
        orderBy: { eventDatetime: 'desc' },
      });

      return {
        events: events.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          inputType: e.inputType,
          descriptionText: e.descriptionText,
          audioUrl: e.audioUrl,
          transcriptionText: e.transcriptionText,
          transcriptionConfidence: e.transcriptionConfidence,
          eventDatetime: e.eventDatetime.toISOString(),
          syncStatus: e.syncStatus,
          createdAt: e.createdAt.toISOString(),
        })),
      };
    },
  );

  // ── Estatísticas agregadas ────────────────────────────────────────────
  app.get<{ Params: PatientParams; Querystring: { days?: string } }>(
    '/patients/:patientId/health-events/stats',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const days = Math.max(1, Math.min(365, Number(request.query.days) || 30));
      const to = new Date();
      const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      from.setUTCHours(0, 0, 0, 0);

      const rows = await prisma.healthEventLog.findMany({
        where: { patientId: access.patientId, eventDatetime: { gte: from } },
        orderBy: { eventDatetime: 'asc' },
      });

      // ── Totais ──
      const distinctDays = new Set(rows.map((r) => ymd(r.eventDatetime))).size;

      // ── Distribuição por tipo ──
      const typeMap = new Map<string, number>();
      for (const r of rows) {
        typeMap.set(r.eventType, (typeMap.get(r.eventType) ?? 0) + 1);
      }
      const byType = [...typeMap.entries()]
        .map(([type, count]) => ({
          type,
          count,
          percent: rows.length > 0 ? Math.round((count / rows.length) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      // ── Dia da semana (0=domingo) ──
      const weekday = [0, 0, 0, 0, 0, 0, 0];
      for (const r of rows) weekday[r.eventDatetime.getUTCDay()] += 1;

      // ── Top descrições ──
      const topDescriptions = countOccurrences(
        rows.map((r) => r.descriptionText ?? ''),
      ).slice(0, 10);

      const stats: HealthEventStats = {
        range: { from: ymd(from), to: ymd(to), days },
        totals: {
          count: rows.length,
          distinctDays,
          averagePerWeek: Math.round((rows.length / (days / 7)) * 10) / 10,
        },
        byType,
        weekday,
        topDescriptions,
      };

      return { stats };
    },
  );
}
