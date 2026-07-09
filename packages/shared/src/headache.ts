/**
 * Diário de Cefaleia — contrato compartilhado (listas padrão, regiões da
 * cabeça e helpers de intensidade/período). Usado pelo wizard de registro
 * no mobile e pelos cálculos de estatística na API.
 */

// ── Períodos de início da crise ─────────────────────────────────────────────
export const HEADACHE_PERIODS = ['madrugada', 'manha', 'tarde', 'noite'] as const;
export type HeadachePeriod = (typeof HEADACHE_PERIODS)[number];

export const HEADACHE_PERIOD_LABELS: Record<HeadachePeriod, string> = {
  madrugada: 'Madrugada',
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

/** Deriva o período do dia a partir da hora (0-23). */
export function periodFromHour(hour: number): HeadachePeriod {
  if (hour >= 0 && hour < 6) return 'madrugada';
  if (hour >= 6 && hour < 12) return 'manha';
  if (hour >= 12 && hour < 18) return 'tarde';
  return 'noite';
}

// ── Tipos de dor de cabeça (Passo 4) ────────────────────────────────────────
export interface HeadacheOption {
  id: string;
  label: string;
}

export const HEADACHE_DEFAULT_TYPES: HeadacheOption[] = [
  { id: 'migraine', label: 'Enxaqueca' },
  { id: 'tension', label: 'Cefaleia tensional' },
  { id: 'cluster', label: 'Cefaleia em salvas' },
];

// ── Intensidade (Passo 3) ───────────────────────────────────────────────────
export type IntensityLabel = 'Leve' | 'Moderado' | 'Severo';

export interface IntensityLevel {
  key: 'leve' | 'moderado' | 'severo';
  label: IntensityLabel;
  description: string;
  /** Faixa na escala 1-10 (inclusiva). */
  min: number;
  max: number;
}

export const HEADACHE_INTENSITY_LEVELS: IntensityLevel[] = [
  { key: 'leve', label: 'Leve', description: 'Mantenho minhas atividades', min: 1, max: 3 },
  { key: 'moderado', label: 'Moderado', description: 'Atividades reduzidas', min: 4, max: 7 },
  { key: 'severo', label: 'Severo', description: 'Não consigo fazer nada', min: 8, max: 10 },
];

/** Converte o valor contínuo do slider (0..1) para a escala 1-10 do banco. */
export function sliderToIntensity(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return Math.round(clamped * 9) + 1; // 1..10
}

/** Converte a escala 1-10 de volta para 0..1 (posição do slider). */
export function intensityToSlider(intensity: number): number {
  return (Math.max(1, Math.min(10, intensity)) - 1) / 9;
}

/** Rótulo textual da intensidade (1-10). */
export function intensityLabel(intensity: number | null | undefined): IntensityLabel | '—' {
  if (intensity == null) return '—';
  const level = HEADACHE_INTENSITY_LEVELS.find((l) => intensity >= l.min && intensity <= l.max);
  return level?.label ?? '—';
}

// ── Duração (Passo 2) ───────────────────────────────────────────────────────
export interface DurationStep {
  label: string;
  minutes: number | null;
}

export const HEADACHE_DURATION_STEPS: DurationStep[] = [
  { label: 'Não sei', minutes: null },
  { label: '30 min', minutes: 30 },
  { label: '1 hora', minutes: 60 },
  { label: '2 horas', minutes: 120 },
  { label: '3 horas', minutes: 180 },
  { label: '4 horas', minutes: 240 },
  { label: '6 horas', minutes: 360 },
  { label: '8+ horas', minutes: 480 },
];

// ── Localização da dor (Passo 5) ────────────────────────────────────────────
export interface HeadRegion {
  id: string;
  label: string;
  /** Posição aproximada (0..1) sobre o mapa da cabeça, para o overlay. */
  x: number;
  y: number;
}

export const HEAD_REGIONS_FRONT: HeadRegion[] = [
  { id: 'skull', label: 'Crânio', x: 0.5, y: 0.08 },
  { id: 'forehead', label: 'Testa', x: 0.5, y: 0.24 },
  { id: 'temple_right', label: 'Têmpora direita', x: 0.18, y: 0.34 },
  { id: 'temple_left', label: 'Têmpora esquerda', x: 0.82, y: 0.34 },
  { id: 'eye_right', label: 'Olho direito', x: 0.35, y: 0.42 },
  { id: 'eye_left', label: 'Olho esquerdo', x: 0.65, y: 0.42 },
  { id: 'ear_right', label: 'Orelha direita', x: 0.08, y: 0.46 },
  { id: 'ear_left', label: 'Orelha esquerda', x: 0.92, y: 0.46 },
  { id: 'nose_bridge', label: 'Ponte do nariz', x: 0.5, y: 0.5 },
  { id: 'cheek_right', label: 'Bochecha direita', x: 0.3, y: 0.62 },
  { id: 'cheek_left', label: 'Bochecha esquerda', x: 0.7, y: 0.62 },
  { id: 'jaw', label: 'Mandíbula/Dentes', x: 0.5, y: 0.72 },
  { id: 'chin', label: 'Queixo', x: 0.5, y: 0.82 },
];

export const HEAD_REGIONS_BACK: HeadRegion[] = [
  { id: 'occipital', label: 'Occipital', x: 0.5, y: 0.2 },
  { id: 'back_left', label: 'Lado esquerdo posterior', x: 0.72, y: 0.42 },
  { id: 'back_right', label: 'Lado direito posterior', x: 0.28, y: 0.42 },
  { id: 'nape', label: 'Nuca', x: 0.5, y: 0.72 },
];

// ── Sintomas (Passo 6) ──────────────────────────────────────────────────────
export const HEADACHE_DEFAULT_SYMPTOMS: string[] = [
  'Ansiedade',
  'Aura',
  'Bocejo',
  'Calor',
  'Cansaço',
  'Confusão',
  'Congestão nasal',
  'Desejo intenso',
  'Diarreia',
  'Dificuldade de concentração',
  'Dor no pescoço',
  'Fadiga',
  'Irritabilidade',
  'Lacrimejamento',
  'Náusea',
  'Sensibilidade à luz',
  'Sensibilidade ao som',
  'Tontura',
  'Vômito',
  'Visão turva',
];

// ── Gatilhos (Passo 7) ──────────────────────────────────────────────────────
export const HEADACHE_DEFAULT_TRIGGERS: string[] = [
  'Álcool',
  'Alergia',
  'Ansiedade',
  'Barulho',
  'Cafeína',
  'Calor',
  'Cheiro forte',
  'Clima',
  'Comida',
  'Desidratação',
  'Estresse',
  'Exercício',
  'Jejum',
  'Luz forte',
  'Menstruação',
  'Privação de sono',
  'Tela/computador',
  'Viagem',
];

// ── Medicamentos (Passo 8) ──────────────────────────────────────────────────
export const HEADACHE_COMMON_MEDICATIONS: string[] = [
  'Ácido acetilsalicílico',
  'Adderall',
  'Advil',
  'Aleve',
  'Almotriptano',
  'Dipirona',
  'Ibuprofeno',
  'Naratriptano',
  'Paracetamol',
  'Rizatriptano',
  'Sumatriptano',
  'Topiramato',
  'Ubrelvy',
  'Zomig',
];

// ── Métodos de alívio (Passo 9) ─────────────────────────────────────────────
export const HEADACHE_DEFAULT_RELIEF: string[] = [
  'Banho frio',
  'Banho quente',
  'Beber água',
  'Bolsa térmica',
  'Cafeína',
  'Comida',
  'Compressas geladas',
  'Descanso no escuro',
  'Dormir',
  'Ioga',
  'Massagem',
  'Meditação',
  'Silêncio',
];

// ── Incapacidade / MIDAS (Passo 10) ─────────────────────────────────────────
export interface MidasOption {
  id: string;
  label: string;
  icon: string;
  section: 'none' | 'lost' | 'limited';
}

export const HEADACHE_DISABILITY_OPTIONS: MidasOption[] = [
  { id: 'not_affected', label: 'Não Foi Afetado', icon: '✕', section: 'none' },
  { id: 'missed_work', label: 'Perdeu Trabalho ou Aula', icon: '📋', section: 'lost' },
  { id: 'missed_chores', label: 'Não Consigo Fazer Trabalhos Domésticos', icon: '🏠', section: 'lost' },
  { id: 'missed_social', label: 'Atividades Sociais ou Familiares Perdidas', icon: '👥', section: 'lost' },
  { id: 'slower_work', label: 'Mais Lento no Trabalho ou Escola', icon: '💼', section: 'limited' },
  { id: 'slower_chores', label: 'Mais Lento nos Trabalhos Domésticos', icon: '🏡', section: 'limited' },
];
