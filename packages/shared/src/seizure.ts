/**
 * Diário de Convulsão — contrato compartilhado (listas padrão, tipos de crise,
 * severidade e helpers de formatação). Usado pelo wizard de registro no mobile
 * e pelos cálculos de estatística na API.
 */

// ── Períodos de início da crise ─────────────────────────────────────────────
export const SEIZURE_PERIODS = ['madrugada', 'manha', 'tarde', 'noite'] as const;
export type SeizurePeriod = (typeof SEIZURE_PERIODS)[number];

export const SEIZURE_PERIOD_LABELS: Record<SeizurePeriod, string> = {
  madrugada: 'Madrugada',
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

/** Deriva o período do dia a partir da hora (0-23). */
export function seizurePeriodFromHour(hour: number): SeizurePeriod {
  if (hour >= 0 && hour < 6) return 'madrugada';
  if (hour >= 6 && hour < 12) return 'manha';
  if (hour >= 12 && hour < 18) return 'tarde';
  return 'noite';
}

// ── Tipos de Convulsão ──────────────────────────────────────────────────────
export interface SeizureOption {
  id: string;
  label: string;
}

export const SEIZURE_TYPES: SeizureOption[] = [
  { id: 'focal_aware', label: 'Focal com consciência preservada' },
  { id: 'focal_impaired', label: 'Focal com consciência prejudicada' },
  { id: 'focal_to_bilateral', label: 'Focal para bilateral tônico-clônica' },
  { id: 'generalized_tonic_clonic', label: 'Generalizada tônico-clônica' },
  { id: 'absence', label: 'Ausência' },
  { id: 'myoclonic', label: 'Mioclônica' },
  { id: 'atonic', label: 'Atônica' },
  { id: 'other', label: 'Outro tipo' },
];

// ── Severidade ──────────────────────────────────────────────────────────────
export type SeizureSeverityLabel = 'Leve' | 'Moderado' | 'Severo';

export interface SeizureSeverityLevel {
  key: 'leve' | 'moderado' | 'severo';
  label: SeizureSeverityLabel;
  description: string;
}

export const SEIZURE_SEVERITY_LEVELS: SeizureSeverityLevel[] = [
  { key: 'leve', label: 'Leve', description: 'Crise breve sem complicações' },
  { key: 'moderado', label: 'Moderado', description: 'Crise com recuperação lenta' },
  { key: 'severo', label: 'Severo', description: 'Crise prolongada ou com lesão' },
];

// ── Duração ─────────────────────────────────────────────────────────────────
export interface SeizureDurationStep {
  label: string;
  minutes: number | null;
}

export const SEIZURE_DURATION_STEPS: SeizureDurationStep[] = [
  { label: 'Não sei', minutes: null },
  { label: '1 min', minutes: 1 },
  { label: '2 min', minutes: 2 },
  { label: '3 min', minutes: 3 },
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
  { label: '20+ min', minutes: 20 },
];

// ── Síntomas pré-ictais (aura) ──────────────────────────────────────────────
export const SEIZURE_DEFAULT_AURA_SYMPTOMS: string[] = [
  'Visão borrada',
  'Luzes piscantes',
  'Sensação de déjà vu',
  'Sensação de jamais vu',
  'Medo intenso',
  'Ansiedade',
  'Confusão',
  'Tontura',
  'Formigamento',
  'Gosto metálico',
  'Odores estranhos',
  'Sons distorcidos',
];

// ── Gatilhos comuns ─────────────────────────────────────────────────────────
export const SEIZURE_DEFAULT_TRIGGERS: string[] = [
  'Falta de sono',
  'Estresse',
  'Esquecimento de medicação',
  'Álcool',
  'Cafeína em excesso',
  'Luzes piscantes',
  'Padrões visuais',
  'Febre',
  'Menstruação',
  'Desidratação',
  'Jejum prolongado',
  'Exercício intenso',
];

// ── Medicamentos anticonvulsivantes comuns ──────────────────────────────────
export const SEIZURE_COMMON_MEDICATIONS: string[] = [
  'Ácido valproico',
  'Carbamazepina',
  'Lamotrigina',
  'Levetiracetam',
  'Topiramato',
  'Fenitoína',
  'Fenobarbital',
  'Oxcarbazepina',
  'Gabapentina',
  'Pregabalina',
  'Clonazepam',
  'Diazepam',
];

// ── Perda de consciência ────────────────────────────────────────────────────
export const LOSSES_OF_CONSCIOUSNESS_OPTIONS = [
  { value: true, label: 'Sim' },
  { value: false, label: 'Não' },
];

// ── Visita hospitalar ───────────────────────────────────────────────────────
export const HOSPITAL_VISIT_OPTIONS = [
  { value: true, label: 'Sim' },
  { value: false, label: 'Não' },
];

// ── Medicação tomada corretamente ───────────────────────────────────────────
export const MEDICATION_CORRECTLY_OPTIONS = [
  { value: true, label: 'Sim, tomei corretamente' },
  { value: false, label: 'Não tomei corretamente' },
];

// ── Mudança de marca ────────────────────────────────────────────────────────
export const MEDICATION_BRAND_CHANGED_OPTIONS = [
  { value: true, label: 'Sim, mudei de marca' },
  { value: false, label: 'Não, mantive a mesma marca' },
];

// ── Helpers de formatação ───────────────────────────────────────────────────
/** Formata a duração em minutos para exibição amigável. */
export function formatSeizureDuration(minutes: number | null | undefined): string {
  if (minutes == null) return 'N/A';
  if (minutes === 0) return '0 min';
  const mins = minutes % 60;
  const hours = Math.floor(minutes / 60);
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}min`;
  }
  if (hours > 0) return `${hours}h`;
  return `${mins} min`;
}

/** Classifica a severidade baseado na duração da crise. */
export function seizureSeverityFromDuration(durationMinutes: number | null | undefined): SeizureSeverityLevel | null {
  if (durationMinutes == null) return null;
  if (durationMinutes <= 2) return SEIZURE_SEVERITY_LEVELS[0]; //leve
  if (durationMinutes <= 5) return SEIZURE_SEVERITY_LEVELS[1]; // moderado
  return SEIZURE_SEVERITY_LEVELS[2]; // severo
}

/** Rótulo da perda de consciência. */
export function lossOfConsciousnessLabel(value: boolean): string {
  return value ? 'Com perda de consciência' : 'Sem perda de consciência';
}

/** Rótulo da visita hospitalar. */
export function hospitalVisitLabel(value: boolean): string {
  return value ? 'Visitou hospital' : 'Não visitou hospital';
}

/** Rótulo da medicação tomada corretamente. */
export function medicationTakenCorrectlyLabel(value: boolean): string {
  return value ? 'Medicação tomada corretamente' : 'Medicação não tomada corretamente';
}
