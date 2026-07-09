import {
  SEIZURE_DURATION_STEPS,
  type CreateSeizureDiaryInput,
  type SeizureStats,
} from '@medconecta/shared';
import { apiGet, apiPost } from '../../lib/api';
import type { SeizureDraft, SeizureEntriesResponse } from './types';

/**
 * Converte o rascunho do wizard no payload aceito pela API
 * (createSeizureDiaryInputSchema em packages/shared).
 *
 * Campos booleanos obrigatórios do schema ganham default `false` quando o
 * usuário não escolheu (o wizard valida antes de habilitar o Salvar).
 */
export function draftToPayload(draft: SeizureDraft): CreateSeizureDiaryInput {
  const durationMinutes =
    draft.durationStepIndex != null
      ? SEIZURE_DURATION_STEPS[draft.durationStepIndex]?.minutes ?? 0
      : 0;

  return {
    seizureDate: draft.seizureDate,
    seizureTime: draft.seizureTime,
    lossOfConsciousness: draft.lossOfConsciousness ?? false,
    hospitalVisit: draft.hospitalVisit ?? false,
    hospitalName: draft.hospitalVisit ? (draft.hospitalName.trim() || null) : null,
    durationMinutes,
    medicationTakenCorrectly: draft.medicationTakenCorrectly ?? false,
    medicationBrandChanged: draft.medicationBrandChanged ?? false,
    newMedicationBrand: draft.medicationBrandChanged
      ? (draft.newMedicationBrand.trim() || null)
      : null,
    additionalNotes: draft.additionalNotes.trim() ? draft.additionalNotes.trim() : null,
  };
}

export function createSeizureEntry(patientId: string, draft: SeizureDraft) {
  return apiPost<{ ok: boolean; entry: { id: string } }>(
    `/patients/${patientId}/seizure-diary`,
    draftToPayload(draft),
  );
}

export function listSeizureEntries(patientId: string) {
  return apiGet<SeizureEntriesResponse>(`/patients/${patientId}/seizure-diary`);
}

export function getSeizureStats(patientId: string, days = 30) {
  return apiGet<{ stats: SeizureStats }>(
    `/patients/${patientId}/seizure-diary/stats?days=${days}`,
  );
}
