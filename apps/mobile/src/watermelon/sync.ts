import { synchronize } from '@nozbe/watermelondb/sync';
import type { SyncDatabaseChangeSet } from '@nozbe/watermelondb/sync';
import { localDatabase } from './index';
import { apiGet, apiPost } from '../lib/api';
import { uploadAudioFile } from './audioQueue';

interface SyncResponse {
  changes: SyncDatabaseChangeSet;
  timestamp: number;
}

async function syncTable(patientId: string, endpoint: string): Promise<void> {
  await synchronize({
    database: localDatabase,
    pullChanges: async ({ lastPulledAt }) => {
      const res = await apiGet<SyncResponse>(
        `${endpoint}?last_pulled_at=${lastPulledAt ?? 0}`,
      );
      return { changes: res.changes, timestamp: res.timestamp };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      // Antes do push, faz upload de áudios pendentes.
      const typedChanges = changes as Record<string, { created?: Record<string, unknown>[]; updated?: Record<string, unknown>[]; deleted?: string[] }>;
      const chatChanges = typedChanges.chat_messages;
      if (chatChanges) {
        for (const row of chatChanges.created ?? []) {
          if (row.local_audio_path) {
            try {
              const url = await uploadAudioFile(patientId, row.local_audio_path as string);
              row.audio_url = url;
            } catch {
              // Se falhar upload, mantém local_audio_path para retry posterior.
            }
          }
        }
      }
      await apiPost(endpoint, { changes, last_pulled_at: lastPulledAt });
    },
    migrationsEnabledAtVersion: 1,
  });
}

export async function syncHeadacheEntries(patientId: string): Promise<void> {
  return syncTable(patientId, `/patients/${patientId}/headache-diary/sync`);
}

export async function syncSeizureEntries(patientId: string): Promise<void> {
  return syncTable(patientId, `/patients/${patientId}/seizure-diary/sync`);
}

export async function syncChatMessages(patientId: string): Promise<void> {
  return syncTable(patientId, `/patients/${patientId}/messages/sync`);
}

export async function syncDatabase(patientId: string): Promise<void> {
  await syncHeadacheEntries(patientId);
  await syncSeizureEntries(patientId);
  await syncChatMessages(patientId);
}
