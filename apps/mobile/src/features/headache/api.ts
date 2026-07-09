import {
  sliderToIntensity,
  HEADACHE_DURATION_STEPS,
  type CreateHeadacheDiaryInput,
  type HeadacheStats,
} from '@medconecta/shared';
import { apiGet, apiPost } from '../../lib/api';
import type { CrisisDraft, HeadacheEntriesResponse } from './types';

/** Converte o rascunho do wizard no payload aceito pela API. */
export function draftToPayload(draft: CrisisDraft): CreateHeadacheDiaryInput {
  const durationMinutes =
    draft.durationStepIndex != null
      ? HEADACHE_DURATION_STEPS[draft.durationStepIndex]?.minutes ?? null
      : null;

  return {
    diaryDate: draft.diaryDate,
    startPeriod: draft.startPeriod,
    startTime: draft.startTime,
    endDateTime: draft.endDateTime,
    durationMinutes,
    intensity: draft.intensitySlider != null ? sliderToIntensity(draft.intensitySlider) : null,
    types: draft.types,
    location: draft.location,
    symptoms: draft.symptoms,
    triggers: draft.triggers,
    medications: draft.medications,
    reliefMethods: draft.reliefMethods,
    impactOnActivities: draft.impactOnActivities,
    notes: draft.notes.trim() ? draft.notes.trim() : null,
  };
}

export function createHeadacheEntry(patientId: string, draft: CrisisDraft) {
  return apiPost<{ ok: boolean; entry: { id: string } }>(
    `/patients/${patientId}/headache-diary`,
    draftToPayload(draft),
  );
}

export function listHeadacheEntries(patientId: string) {
  return apiGet<HeadacheEntriesResponse>(`/patients/${patientId}/headache-diary`);
}

export function getHeadacheStats(patientId: string, days = 30) {
  return apiGet<{ stats: HeadacheStats }>(
    `/patients/${patientId}/headache-diary/stats?days=${days}`,
  );
}
