import { formatSeizureDuration } from '@medconecta/shared';

const MONTHS_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

const MONTHS_LONG = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** "2026-06-17" → "17 jun. 2026" */
export function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS_SHORT[m - 1]}. ${y}`;
}

/** "2026-06-17" → "17/06/2026" (formato curto pt-BR) */
export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export function monthLabel(monthIndex: number): string {
  return MONTHS_LONG[monthIndex] ?? '';
}

/** Wrapper local para o helper compartilhado de duração. */
export function formatDuration(minutes: number | null | undefined): string {
  return formatSeizureDuration(minutes);
}

/** Dia do mês a partir de "2026-06-17" → 17 */
export function dayOfMonth(iso: string): number {
  return Number(iso.split('-')[2]) || 0;
}

/** Índice do mês (0-11) a partir de "2026-06-17" */
export function monthIndexOf(iso: string): number {
  return (Number(iso.split('-')[1]) || 1) - 1;
}

export const WEEKDAY_LABELS_PT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
