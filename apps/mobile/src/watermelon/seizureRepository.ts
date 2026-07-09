import { localDatabase } from './index';
import type { SeizureEntry } from './models/SeizureEntry';
import type { SeizureDraft } from '../features/seizure/types';
import { SEIZURE_DURATION_STEPS } from '@medconecta/shared';

function draftToRaw(draft: SeizureDraft, patientId: string): Record<string, unknown> {
  const durationMinutes =
    draft.durationStepIndex != null
      ? SEIZURE_DURATION_STEPS[draft.durationStepIndex]?.minutes ?? 0
      : 0;

  return {
    patient_id: patientId,
    seizure_date: draft.seizureDate,
    seizure_time: draft.seizureTime,
    loss_of_consciousness: draft.lossOfConsciousness ?? false,
    hospital_visit: draft.hospitalVisit ?? false,
    hospital_name: draft.hospitalName.trim() ? draft.hospitalName.trim() : null,
    duration_minutes: durationMinutes,
    medication_taken_correctly: draft.medicationTakenCorrectly ?? false,
    medication_brand_changed: draft.medicationBrandChanged ?? false,
    new_medication_brand: draft.newMedicationBrand.trim() ? draft.newMedicationBrand.trim() : null,
    additional_notes: draft.additionalNotes.trim() ? draft.additionalNotes.trim() : null,
    local_status: 'pending',
    created_at: Date.now(),
    updated_at: Date.now(),
  };
}

export async function createLocalSeizureEntry(
  patientId: string,
  draft: SeizureDraft,
): Promise<SeizureEntry> {
  const raw = draftToRaw(draft, patientId);
  return localDatabase.write<SeizureEntry>(async () => {
    const collection = localDatabase.get<SeizureEntry>('seizure_entries');
    return collection.create((entry) => {
      for (const [key, value] of Object.entries(raw)) {
        (entry._raw as Record<string, unknown>)[key] = value;
      }
    });
  });
}

export function observeSeizureEntries() {
  return localDatabase.get<SeizureEntry>('seizure_entries').query().observe();
}
