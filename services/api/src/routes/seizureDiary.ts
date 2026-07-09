import type { FastifyInstance } from 'fastify';
import {
  createSeizureDiaryInputSchema,
  type SeizureStats,
} from '@medconecta/shared';
import { prisma, Prisma } from '@medconecta/db';
import { authenticate, resolveChatAccess } from '../middleware/auth.js';
import { auditLog } from '../lib/audit.js';

interface PatientParams {
  patientId: string;
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
 * Diário de Convulsão.
 *
 * Quem registra: o PACIENTE (formulário no app).
 * Quem visualiza: o paciente e o médico responsável (relatórios).
 */
export async function registerSeizureDiaryRoutes(app: FastifyInstance) {
  // ── Sincronização WatermelonDB (pull incremental) ──────────────────────
  app.get<{ Params: PatientParams; Querystring: { last_pulled_at?: string } }>(
    '/patients/:patientId/seizure-diary/sync',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const lastPulledAt = request.query.last_pulled_at
        ? Number(request.query.last_pulled_at)
        : 0;

      const entries = await prisma.seizureDiary.findMany({
        where: { patientId: access.patientId },
      });

      const created: Record<string, unknown>[] = [];
      const updated: Record<string, unknown>[] = [];
      const deleted: string[] = [];

      for (const e of entries) {
        const payload = {
          id: e.id,
          patient_id: e.patientId,
          seizure_date: e.seizureDate.getTime(),
          seizure_time: e.seizureTime,
          loss_of_consciousness: e.lossOfConsciousness ? 1 : 0,
          hospital_visit: e.hospitalVisit ? 1 : 0,
          hospital_name: e.hospitalName,
          duration_minutes: e.durationMinutes,
          medication_taken_correctly: e.medicationTakenCorrectly ? 1 : 0,
          medication_brand_changed: e.medicationBrandChanged ? 1 : 0,
          new_medication_brand: e.newMedicationBrand,
          additional_notes: e.additionalNotes,
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
        changes: { seizure_entries: { created, updated, deleted } },
        timestamp,
      };
    },
  );

  // ── Sincronização WatermelonDB (push) ────────────────────────────────────
  interface SyncPushBody {
    changes: {
      seizure_entries?: {
        created?: Record<string, unknown>[];
        updated?: Record<string, unknown>[];
        deleted?: string[];
      };
    };
    last_pulled_at: number;
  }

  app.post<{ Params: PatientParams; Body: SyncPushBody }>(
    '/patients/:patientId/seizure-diary/sync',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const seizureChanges = request.body.changes.seizure_entries ?? {
        created: [],
        updated: [],
        deleted: [],
      };

      const txOps: Prisma.PrismaPromise<unknown>[] = [];

      for (const row of seizureChanges.created ?? []) {
        txOps.push(
          prisma.seizureDiary.upsert({
            where: { id: String(row.id) },
            update: {
              seizureDate: new Date(Number(row.seizure_date)),
              seizureTime: (row.seizure_time as string) ?? null,
              lossOfConsciousness: Boolean(row.loss_of_consciousness),
              hospitalVisit: Boolean(row.hospital_visit),
              hospitalName: (row.hospital_name as string) ?? null,
              durationMinutes: Number(row.duration_minutes),
              medicationTakenCorrectly: Boolean(row.medication_taken_correctly),
              medicationBrandChanged: Boolean(row.medication_brand_changed),
              newMedicationBrand: (row.new_medication_brand as string) ?? null,
              additionalNotes: (row.additional_notes as string) ?? null,
              syncStatus: 'synced',
              updatedAt: new Date(),
            },
            create: {
              id: String(row.id),
              patientId: access.patientId,
              seizureDate: new Date(Number(row.seizure_date)),
              seizureTime: (row.seizure_time as string) ?? null,
              lossOfConsciousness: Boolean(row.loss_of_consciousness),
              hospitalVisit: Boolean(row.hospital_visit),
              hospitalName: (row.hospital_name as string) ?? null,
              durationMinutes: Number(row.duration_minutes),
              medicationTakenCorrectly: Boolean(row.medication_taken_correctly),
              medicationBrandChanged: Boolean(row.medication_brand_changed),
              newMedicationBrand: (row.new_medication_brand as string) ?? null,
              additionalNotes: (row.additional_notes as string) ?? null,
              syncStatus: 'synced',
            },
          }),
        );
      }

      for (const row of seizureChanges.updated ?? []) {
        txOps.push(
          prisma.seizureDiary.updateMany({
            where: { id: String(row.id), patientId: access.patientId },
            data: {
              seizureDate: new Date(Number(row.seizure_date)),
              seizureTime: (row.seizure_time as string) ?? null,
              lossOfConsciousness: Boolean(row.loss_of_consciousness),
              hospitalVisit: Boolean(row.hospital_visit),
              hospitalName: (row.hospital_name as string) ?? null,
              durationMinutes: Number(row.duration_minutes),
              medicationTakenCorrectly: Boolean(row.medication_taken_correctly),
              medicationBrandChanged: Boolean(row.medication_brand_changed),
              newMedicationBrand: (row.new_medication_brand as string) ?? null,
              additionalNotes: (row.additional_notes as string) ?? null,
              syncStatus: 'synced',
              updatedAt: new Date(),
            },
          }),
        );
      }

      for (const id of seizureChanges.deleted ?? []) {
        txOps.push(
          prisma.seizureDiary.deleteMany({
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
    '/patients/:patientId/seizure-diary',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const parsed = createSeizureDiaryInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
      }
      const input = parsed.data;

      const entry = await prisma.seizureDiary.create({
        data: {
          patientId: access.patientId,
          seizureDate: new Date(input.seizureDate),
          seizureTime: input.seizureTime ?? null,
          lossOfConsciousness: input.lossOfConsciousness,
          hospitalVisit: input.hospitalVisit,
          hospitalName: input.hospitalName ?? null,
          durationMinutes: input.durationMinutes,
          medicationTakenCorrectly: input.medicationTakenCorrectly,
          medicationBrandChanged: input.medicationBrandChanged,
          newMedicationBrand: input.newMedicationBrand ?? null,
          additionalNotes: input.additionalNotes ?? null,
          syncStatus: 'synced',
        },
      });

      await auditLog({
        userId: access.role === 'patient' ? request.authUser?.id : undefined,
        resourceType: 'seizure_diary',
        resourceId: entry.id,
        action: 'create_seizure_diary',
        ipAddress: request.ip,
      });

      return reply.code(201).send({ ok: true, entry });
    },
  );

  // ── Listar registros (histórico) ───────────────────────────────────────
  app.get<{ Params: PatientParams }>(
    '/patients/:patientId/seizure-diary',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const entries = await prisma.seizureDiary.findMany({
        where: { patientId: access.patientId },
        orderBy: { seizureDate: 'desc' },
      });

      return {
        entries: entries.map((e) => ({
          id: e.id,
          seizureDate: ymd(e.seizureDate),
          seizureTime: e.seizureTime,
          lossOfConsciousness: e.lossOfConsciousness,
          hospitalVisit: e.hospitalVisit,
          hospitalName: e.hospitalName,
          durationMinutes: e.durationMinutes,
          medicationTakenCorrectly: e.medicationTakenCorrectly,
          medicationBrandChanged: e.medicationBrandChanged,
          newMedicationBrand: e.newMedicationBrand,
          additionalNotes: e.additionalNotes,
          createdAt: e.createdAt.toISOString(),
        })),
      };
    },
  );

  // ── Estatísticas agregadas ─────────────────────────────────────────────
  app.get<{ Params: PatientParams; Querystring: { days?: string } }>(
    '/patients/:patientId/seizure-diary/stats',
    { preHandler: authenticate },
    async (request, reply) => {
      const access = await resolveChatAccess(request, request.params.patientId);
      if (!access) return reply.code(403).send({ error: 'forbidden' });

      const days = Math.max(1, Math.min(365, Number(request.query.days) || 30));
      const to = new Date();
      const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      from.setUTCHours(0, 0, 0, 0);

      const rows = await prisma.seizureDiary.findMany({
        where: { patientId: access.patientId, seizureDate: { gte: from } },
        orderBy: { seizureDate: 'asc' },
      });

      // ── Totais ──
      const distinctDays = new Set(rows.map((r) => ymd(r.seizureDate)));

      // ── Perda de consciência ──
      const withLoss = rows.filter((r) => r.lossOfConsciousness).length;
      const withoutLoss = rows.length - withLoss;
      const percentWithLoss = rows.length > 0 ? Math.round((withLoss / rows.length) * 100) : 0;

      // ── Visita hospitalar ──
      const visited = rows.filter((r) => r.hospitalVisit).length;
      const notVisited = rows.length - visited;
      const percentVisited = rows.length > 0 ? Math.round((visited / rows.length) * 100) : 0;

      // ── Hospitais mais citados ──
      const hospitalNames = rows
        .map((r) => r.hospitalName)
        .filter((n): n is string => n != null);
      const mostCited = countOccurrences(hospitalNames);

      // ── Medicação tomada corretamente ──
      const takenCorrectly = rows.filter((r) => r.medicationTakenCorrectly).length;
      const notTaken = rows.length - takenCorrectly;
      const percentCorrect = rows.length > 0 ? Math.round((takenCorrectly / rows.length) * 100) : 0;

      // ── Mudança de marca ──
      const changed = rows.filter((r) => r.medicationBrandChanged).length;
      const notChanged = rows.length - changed;
      const brandNames = rows
        .filter((r) => r.medicationBrandChanged)
        .map((r) => r.newMedicationBrand)
        .filter((n): n is string => n != null);
      const topBrands = countOccurrences(brandNames);

      // ── Duração ──
      const withDuration = rows.filter((r) => r.durationMinutes != null && r.durationMinutes > 0);
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
        longestDate = ymd(longest.seizureDate);
        shortestDate = ymd(shortest.seizureDate);
      }

      // ── Dia da semana (0=domingo) ──
      const weekday = [0, 0, 0, 0, 0, 0, 0];
      for (const r of rows) weekday[r.seizureDate.getUTCDay()] += 1;

      const stats: SeizureStats = {
        range: { from: ymd(from), to: ymd(to), days },
        totals: {
          count: rows.length,
          daysWithSeizure: distinctDays.size,
          percentDaysWithSeizure: Math.round((distinctDays.size / days) * 100),
        },
        frequencyPerWeek: Math.round((rows.length / (days / 7)) * 10) / 10,
        consciousness: {
          withLoss,
          withoutLoss,
          percentWithLoss,
        },
        hospital: {
          visited,
          notVisited,
          percentVisited,
          mostCited,
        },
        medication: {
          takenCorrectly,
          notTaken,
          percentCorrect,
        },
        brandChange: {
          changed,
          notChanged,
          topBrands,
        },
        duration: { avgMinutes, longestMinutes, shortestMinutes, longestDate, shortestDate },
        weekday,
        triggers: [],
        auraSymptoms: [],
      };

      return { stats };
    },
  );
}
