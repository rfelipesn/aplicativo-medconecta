import type { SeizureStats } from '@medconecta/shared';

/** Registro de crise de convulsão como devolvido pela API. */
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

export type { SeizureStats };
export interface SeizureStatsResponse {
  stats: SeizureStats;
}
