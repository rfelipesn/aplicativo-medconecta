import type { HeadachePeriod } from '@medconecta/shared';

/** Registro de crise como devolvido pela API. */
export interface HeadacheEntry {
  id: string;
  diaryDate: string;
  startPeriod: string | null;
  endDateTime: string | null;
  durationMinutes: number | null;
  intensity: number | null;
  intensityLabel: string;
  types: string[];
  location: { front: string[]; back: string[] } | null;
  symptoms: string[];
  triggers: string[];
  medications: string[];
  reliefMethods: string[];
  impactOnActivities: string[];
  notes: string | null;
  createdAt: string;
}

export interface HeadacheEntriesResponse {
  entries: HeadacheEntry[];
}

/** Rascunho do wizard (estado local enquanto o usuário preenche). */
export interface CrisisDraft {
  diaryDate: string; // YYYY-MM-DD
  startPeriod: HeadachePeriod | null;
  /** Chip selecionado no passo Data (período | 'agora' | 'exato') para refletir na UI. */
  startChoice: string | null;
  startTime: string | null; // HH:mm (quando "Exato"/"Agora")
  endDateTime: string | null;
  durationStepIndex: number | null; // índice em HEADACHE_DURATION_STEPS
  intensitySlider: number | null; // 0..1
  types: string[];
  location: { front: string[]; back: string[] };
  symptoms: string[];
  triggers: string[];
  medications: string[];
  reliefMethods: string[];
  impactOnActivities: string[];
  notes: string;
}

export function emptyDraft(): CrisisDraft {
  const today = new Date().toISOString().slice(0, 10);
  return {
    diaryDate: today,
    startPeriod: null,
    startChoice: null,
    startTime: null,
    endDateTime: null,
    durationStepIndex: null,
    intensitySlider: null,
    types: [],
    location: { front: [], back: [] },
    symptoms: [],
    triggers: [],
    medications: [],
    reliefMethods: [],
    impactOnActivities: [],
    notes: '',
  };
}
