import type { FastifyInstance } from 'fastify';
import {
  createHeadacheDiaryInputSchema,
  intensityLabel,
  type HeadacheStats,
} from '@medconecta/shared';
import { prisma, Prisma } from '@medconecta/db';
import { authenticate, resolveChatAccess } from '../middleware/auth.js';
import { auditLog } from '../lib/audit.js';

interface PatientParams {
  patientId: string;
}

/** Coerção defensiva de campos jsonb para string[]. */
function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

/** medicationsTaken é guardado como [{ name }]; extrai os nomes. */
function medicationNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === 'object' && v && 'name' in v ? String((v as { name: unknown }).name) : null))
    .filter((v): v is string => Boolean(v));
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function countOccurrences(items: string[]): Array<{ name: string; count: number }> {
  const map = new Map<string, number>();
  for (const item of items) map.set(item, (map.get(item) ?? 0) + 1);
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Diário de Cefaleia.
 *
 * Quem registra: o PACIENTE (wizard de 11 passos no app).
 * Quem visualiza: o paciente e o médico responsável (relatórios).
 */
export async function registerHeadacheDiaryRoutes(app: FastifyInstance) {
  // ── Sincronização WatermelonDB (pull incremental) ──────────────────────
  app.get<{ Params: PatientParams; Querystring: { last_pulled_at?: string } }>(
    '/patients/:patientId/headache-diary/sync',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const lastPulledAt = request.query.last_pulled_at
        ? Number(request.query.last_pulled_at)
        : 0;

      const entries = await prisma.headacheDiary.findMany({
        where: { patientId: access.patientId },
      });

      const created: Record<string, unknown>[] = [];
      const updated: Record<string, unknown>[] = [];
      const deleted: string[] = [];

      for (const e of entries) {
        // Soft delete futuro: por ora não há coluna deleted_at em headache_diary.
        const payload = {
          id: e.id,
          patient_id: e.patientId,
          diary_date: e.diaryDate.getTime(),
          start_period: e.startTime,
          start_time: e.startTime,
          end_datetime: e.endTime?.getTime() ?? null,
          duration_minutes: e.durationMinutes,
          intensity: e.intensity,
          types: JSON.stringify(asStringArray(e.types)),
          location: JSON.stringify(e.location ?? {}),
          symptoms: JSON.stringify(asStringArray(e.symptoms)),
          triggers: JSON.stringify(asStringArray(e.triggers)),
          medications: JSON.stringify(medicationNames(e.medicationsTaken)),
          relief_methods: JSON.stringify(asStringArray(e.reliefMethods)),
          impact_on_activities: JSON.stringify(asStringArray(e.impactOnActivities)),
          notes: e.notes,
          sync_status: 'synced',
          created_at: e.createdAt.getTime(),
          updated_at: e.updatedAt.getTime(),
        };

        if (e.createdAt.getTime() > lastPulledAt) {
          created.push(payload);
        } else if (e.updatedAt.getTime() > lastPulledAt) {
          updated.push(payload);
        }
      }

      const timestamp = Date.now();
      return {
        changes: { headache_entries: { created, updated, deleted } },
        timestamp,
      };
    },
  );

  // ── Sincronização WatermelonDB (push) ────────────────────────────────────
  interface SyncPushBody {
    changes: {
      headache_entries?: {
        created?: Record<string, unknown>[];
        updated?: Record<string, unknown>[];
        deleted?: string[];
      };
    };
    last_pulled_at: number;
  }

  app.post<{ Params: PatientParams; Body: SyncPushBody }>(
    '/patients/:patientId/headache-diary/sync',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const headacheChanges = request.body.changes.headache_entries ?? {
        created: [],
        updated: [],
        deleted: [],
      };

      const txOps: Prisma.PrismaPromise<unknown>[] = [];

      for (const row of (headacheChanges.created ?? []) as Record<string, unknown>[]) {
        txOps.push(
          prisma.headacheDiary.upsert({
            where: { id: String(row.id) },
            update: {
              diaryDate: new Date(Number(row.diary_date)),
              startTime: (row.start_period as string) ?? (row.start_time as string) ?? null,
              endTime: row.end_datetime ? new Date(Number(row.end_datetime)) : null,
              durationMinutes: typeof row.duration_minutes === 'number' ? row.duration_minutes : null,
              intensity: typeof row.intensity === 'number' ? row.intensity : null,
              types: JSON.parse((row.types as string) ?? '[]'),
              location: JSON.parse((row.location as string) ?? '{}'),
              symptoms: JSON.parse((row.symptoms as string) ?? '[]'),
              triggers: JSON.parse((row.triggers as string) ?? '[]'),
              medicationsTaken: JSON.parse((row.medications as string) ?? '[]').map((name: string) => ({ name })),
              reliefMethods: JSON.parse((row.relief_methods as string) ?? '[]'),
              impactOnActivities: JSON.parse((row.impact_on_activities as string) ?? '[]'),
              notes: (row.notes as string) ?? null,
              syncStatus: 'synced',
              updatedAt: new Date(),
            },
            create: {
              id: String(row.id),
              patientId: access.patientId,
              diaryDate: new Date(Number(row.diary_date)),
              startTime: (row.start_period as string) ?? (row.start_time as string) ?? null,
              endTime: row.end_datetime ? new Date(Number(row.end_datetime)) : null,
              durationMinutes: typeof row.duration_minutes === 'number' ? row.duration_minutes : null,
              intensity: typeof row.intensity === 'number' ? row.intensity : null,
              types: JSON.parse((row.types as string) ?? '[]'),
              location: JSON.parse((row.location as string) ?? '{}'),
              symptoms: JSON.parse((row.symptoms as string) ?? '[]'),
              triggers: JSON.parse((row.triggers as string) ?? '[]'),
              medicationsTaken: JSON.parse((row.medications as string) ?? '[]').map((name: string) => ({ name })),
              reliefMethods: JSON.parse((row.relief_methods as string) ?? '[]'),
              impactOnActivities: JSON.parse((row.impact_on_activities as string) ?? '[]'),
              notes: (row.notes as string) ?? null,
              syncStatus: 'synced',
            },
          }),
        );
      }

      for (const row of (headacheChanges.updated ?? []) as Record<string, unknown>[]) {
        txOps.push(
          prisma.headacheDiary.updateMany({
            where: { id: String(row.id), patientId: access.patientId },
            data: {
              diaryDate: new Date(Number(row.diary_date)),
              startTime: (row.start_period as string) ?? (row.start_time as string) ?? null,
              endTime: row.end_datetime ? new Date(Number(row.end_datetime)) : null,
              durationMinutes: typeof row.duration_minutes === 'number' ? row.duration_minutes : null,
              intensity: typeof row.intensity === 'number' ? row.intensity : null,
              types: JSON.parse((row.types as string) ?? '[]'),
              location: JSON.parse((row.location as string) ?? '{}'),
              symptoms: JSON.parse((row.symptoms as string) ?? '[]'),
              triggers: JSON.parse((row.triggers as string) ?? '[]'),
              medicationsTaken: JSON.parse((row.medications as string) ?? '[]').map((name: string) => ({ name })),
              reliefMethods: JSON.parse((row.relief_methods as string) ?? '[]'),
              impactOnActivities: JSON.parse((row.impact_on_activities as string) ?? '[]'),
              notes: (row.notes as string) ?? null,
              syncStatus: 'synced',
              updatedAt: new Date(),
            },
          }),
        );
      }

      for (const id of headacheChanges.deleted ?? []) {
        txOps.push(
          prisma.headacheDiary.deleteMany({
            where: { id, patientId: access.patientId },
          }),
        );
      }

      await prisma.$transaction(txOps);
      return { ok: true };
    },
  );

  // ── Criar registro de crise ────────────────────────────────────────────
  app.post<{ Params: PatientParams }>(
    '/patients/:patientId/headache-diary',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const parsed = createHeadacheDiaryInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
      }
      const input = parsed.data;

      const entry = await prisma.headacheDiary.create({
        data: {
          patientId: access.patientId,
          diaryDate: new Date(input.diaryDate),
          // Guardamos o período resolvido em start_time (madrugada/manha/tarde/noite).
          startTime: input.startPeriod ?? null,
          endTime: input.endDateTime ? new Date(input.endDateTime) : null,
          durationMinutes: input.durationMinutes ?? null,
          intensity: input.intensity ?? null,
          types: input.types,
          location: input.location,
          symptoms: input.symptoms,
          triggers: input.triggers,
          medicationsTaken: input.medications.map((name) => ({ name })),
          reliefMethods: input.reliefMethods,
          impactOnActivities: input.impactOnActivities,
          notes: input.notes ?? null,
          syncStatus: 'synced',
        },
      });

      await auditLog({
        userId: access.role === 'patient' ? request.authUser?.id : access.doctorId,
        resourceType: 'headache_diary',
        resourceId: entry.id,
        action: 'create_headache_diary',
        ipAddress: request.ip,
      });

      return reply.code(201).send({ ok: true, entry });
    },
  );

  // ── Listar registros (histórico + notas) ───────────────────────────────
  app.get<{ Params: PatientParams }>(
    '/patients/:patientId/headache-diary',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const entries = await prisma.headacheDiary.findMany({
        where: { patientId: access.patientId },
        orderBy: { diaryDate: 'desc' },
      });

      return {
        entries: entries.map((e) => ({
          id: e.id,
          diaryDate: ymd(e.diaryDate),
          startPeriod: e.startTime,
          endDateTime: e.endTime?.toISOString() ?? null,
          durationMinutes: e.durationMinutes,
          intensity: e.intensity,
          intensityLabel: intensityLabel(e.intensity),
          types: asStringArray(e.types),
          location: e.location,
          symptoms: asStringArray(e.symptoms),
          triggers: asStringArray(e.triggers),
          medications: medicationNames(e.medicationsTaken),
          reliefMethods: asStringArray(e.reliefMethods),
          impactOnActivities: asStringArray(e.impactOnActivities),
          notes: e.notes,
          createdAt: e.createdAt.toISOString(),
        })),
      };
    },
  );

  // ── Estatísticas agregadas ─────────────────────────────────────────────
  app.get<{ Params: PatientParams; Querystring: { days?: string } }>(
    '/patients/:patientId/headache-diary/stats',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const days = Math.max(1, Math.min(365, Number(request.query.days) || 30));
      const to = new Date();
      const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      from.setUTCHours(0, 0, 0, 0);

      const rows = await prisma.headacheDiary.findMany({
        where: { patientId: access.patientId, diaryDate: { gte: from } },
        orderBy: { diaryDate: 'asc' },
      });

      // ── Totais ──
      const distinctDays = new Set(rows.map((r) => ymd(r.diaryDate)));
      const daysWithMedication = new Set(
        rows.filter((r) => medicationNames(r.medicationsTaken).length > 0).map((r) => ymd(r.diaryDate)),
      );

      // ── Severidade ──
      const severity = { leve: 0, moderado: 0, severo: 0 };
      for (const r of rows) {
        const label = intensityLabel(r.intensity);
        if (label === 'Leve') severity.leve += 1;
        else if (label === 'Moderado') severity.moderado += 1;
        else if (label === 'Severo') severity.severo += 1;
      }
      const predominant =
        severity.leve === 0 && severity.moderado === 0 && severity.severo === 0
          ? null
          : (['leve', 'moderado', 'severo'] as const).reduce((a, b) =>
              severity[b] > severity[a] ? b : a,
            );

      // ── Início do dia ──
      const startOfDay = { madrugada: 0, manha: 0, tarde: 0, noite: 0 };
      for (const r of rows) {
        const p = r.startTime as keyof typeof startOfDay | null;
        if (p && p in startOfDay) startOfDay[p] += 1;
      }

      // ── Duração ──
      const withDuration = rows.filter((r) => r.durationMinutes != null);
      let avgMinutes: number | null = null;
      let longestMinutes: number | null = null;
      let shortestMinutes: number | null = null;
      let longestDate: string | null = null;
      let shortestDate: string | null = null;
      if (withDuration.length > 0) {
        const sum = withDuration.reduce((acc, r) => acc + (r.durationMinutes ?? 0), 0);
        avgMinutes = Math.round(sum / withDuration.length);
        const longest = withDuration.reduce((a, b) =>
          (b.durationMinutes ?? 0) > (a.durationMinutes ?? 0) ? b : a,
        );
        const shortest = withDuration.reduce((a, b) =>
          (b.durationMinutes ?? 0) < (a.durationMinutes ?? 0) ? b : a,
        );
        longestMinutes = longest.durationMinutes;
        shortestMinutes = shortest.durationMinutes;
        longestDate = ymd(longest.diaryDate);
        shortestDate = ymd(shortest.diaryDate);
      }

      // ── Dia da semana (0=domingo) ──
      const weekday = [0, 0, 0, 0, 0, 0, 0];
      for (const r of rows) weekday[r.diaryDate.getUTCDay()] += 1;

      // ── Localização ──
      const frontCounts: string[] = [];
      const backCounts: string[] = [];
      const sides = { both: 0, left: 0, right: 0 };
      for (const r of rows) {
        const loc = (r.location ?? {}) as { front?: unknown; back?: unknown };
        const front = asStringArray(loc.front);
        const back = asStringArray(loc.back);
        frontCounts.push(...front);
        backCounts.push(...back);
        const all = [...front, ...back];
        const hasLeft = all.some((id) => id.includes('left'));
        const hasRight = all.some((id) => id.includes('right'));
        if (hasLeft && hasRight) sides.both += 1;
        else if (hasLeft) sides.left += 1;
        else if (hasRight) sides.right += 1;
        else if (all.length > 0) sides.both += 1; // regiões centrais = bilateral
      }

      const stats: HeadacheStats = {
        range: { from: ymd(from), to: ymd(to), days },
        totals: {
          count: rows.length,
          daysWithHeadache: distinctDays.size,
          daysWithMedication: daysWithMedication.size,
          daysWithout: Math.max(0, days - distinctDays.size),
          percentDaysWithHeadache: Math.round((distinctDays.size / days) * 100),
        },
        severity: { ...severity, predominant },
        startOfDay,
        duration: { avgMinutes, longestMinutes, shortestMinutes, longestDate, shortestDate },
        weekday,
        frequencyPerWeek: Math.round((rows.length / (days / 7)) * 10) / 10,
        location: {
          front: countOccurrences(frontCounts).map((x) => ({ region: x.name, count: x.count })),
          back: countOccurrences(backCounts).map((x) => ({ region: x.name, count: x.count })),
          sides,
        },
        triggers: countOccurrences(rows.flatMap((r) => asStringArray(r.triggers))),
        medications: countOccurrences(rows.flatMap((r) => medicationNames(r.medicationsTaken))),
        reliefMethods: countOccurrences(rows.flatMap((r) => asStringArray(r.reliefMethods))),
        symptoms: countOccurrences(rows.flatMap((r) => asStringArray(r.symptoms))),
      };

      return { stats };
    },
  );
}
