import { localDatabase } from './index';
import type { HeadacheEntry } from './models/HeadacheEntry';
import type { CrisisDraft } from '../features/headache/types';
import { HEADACHE_DURATION_STEPS, sliderToIntensity } from '@medconecta/shared';

function draftToRaw(draft: CrisisDraft, patientId: string): Record<string, unknown> {
  const durationMinutes =
    draft.durationStepIndex != null
      ? HEADACHE_DURATION_STEPS[draft.durationStepIndex]?.minutes ?? null
      : null;

  return {
    patient_id: patientId,
    diary_date: new Date(draft.diaryDate).setUTCHours(0, 0, 0, 0),
    start_period: draft.startPeriod ?? null,
    start_time: draft.startTime,
    end_datetime: draft.endDateTime ? new Date(draft.endDateTime).getTime() : null,
    duration_minutes: durationMinutes,
    intensity: draft.intensitySlider != null ? sliderToIntensity(draft.intensitySlider) : null,
    types: JSON.stringify(draft.types),
    location: JSON.stringify(draft.location),
    symptoms: JSON.stringify(draft.symptoms),
    triggers: JSON.stringify(draft.triggers),
    medications: JSON.stringify(draft.medications),
    relief_methods: JSON.stringify(draft.reliefMethods),
    impact_on_activities: JSON.stringify(draft.impactOnActivities),
    notes: draft.notes.trim() ? draft.notes.trim() : null,
    local_status: 'pending',
    created_at: Date.now(),
    updated_at: Date.now(),
  };
}

export async function createLocalHeadacheEntry(
  patientId: string,
  draft: CrisisDraft,
): Promise<HeadacheEntry> {
  const raw = draftToRaw(draft, patientId);
  return localDatabase.write<HeadacheEntry>(async () => {
    const collection = localDatabase.get<HeadacheEntry>('headache_entries');
    return collection.create((entry) => {
      for (const [key, value] of Object.entries(raw)) {
        (entry._raw as Record<string, unknown>)[key] = value;
      }
    });
  });
}

export function observeHeadacheEntries() {
  return localDatabase.get<HeadacheEntry>('headache_entries').query().observe();
}
