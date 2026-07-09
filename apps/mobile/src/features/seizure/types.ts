import type { SeizurePeriod } from '@medconecta/shared';

/** Registro de convulsão como devolvido pela API (listagem/histórico). */
export interface SeizureEntry {
  id: string;
  seizureDate: string; // YYYY-MM-DD
  seizureTime: string | null; // HH:mm
  lossOfConsciousness: boolean;
  hospitalVisit: boolean;
  hospitalName: string | null;
  durationMinutes: number;
  medicationTakenCorrectly: boolean;
  medicationBrandChanged: boolean;
  newMedicationBrand: string | null;
  additionalNotes: string | null;
  createdAt: string;
}

export interface SeizureEntriesResponse {
  entries: SeizureEntry[];
}

/**
 * Rascunho do wizard (estado local enquanto o usuário preenche).
 * `durationStepIndex` indexa SEIZURE_DURATION_STEPS do shared.
 * `lossOfConsciousness`/`hospitalVisit`/`medicationTakenCorrectly`/
 * `medicationBrandChanged` começam nulos e são definidos no step respectivo.
 */
export interface SeizureDraft {
  seizureDate: string; // YYYY-MM-DD
  /** Período do dia (chips) — armazena apenas para refletir na UI. */
  startPeriod: SeizurePeriod | null;
  /** Chip selecionado no passo Data (período | 'agora' | 'exato'). */
  startChoice: string | null;
  /** Hora exata "HH:mm" (quando "Exato"/"Agora"). */
  seizureTime: string | null;
  /** Índice em SEIZURE_DURATION_STEPS (shared). Null = não escolheu. */
  durationStepIndex: number | null;
  lossOfConsciousness: boolean | null;
  hospitalVisit: boolean | null;
  hospitalName: string;
  medicationTakenCorrectly: boolean | null;
  medicationBrandChanged: boolean | null;
  newMedicationBrand: string;
  additionalNotes: string;
}

export function emptySeizureDraft(): SeizureDraft {
  const today = new Date().toISOString().slice(0, 10);
  return {
    seizureDate: today,
    startPeriod: null,
    startChoice: null,
    seizureTime: null,
    durationStepIndex: null,
    lossOfConsciousness: null,
    hospitalVisit: null,
    hospitalName: '',
    medicationTakenCorrectly: null,
    medicationBrandChanged: null,
    newMedicationBrand: '',
    additionalNotes: '',
  };
}
