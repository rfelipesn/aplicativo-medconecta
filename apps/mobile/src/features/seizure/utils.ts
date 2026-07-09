/** "2026-06-17" + nDays → nova string YYYY-MM-DD */
export function addDays(iso: string, nDays: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + nDays);
  return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Hora atual "HH:mm". */
export function nowHHmm(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const MONTHS_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

/** "2026-06-17" → "17 jun. 2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS_SHORT[m - 1]}. ${y}`;
}

/** minutos → "~3h" / "~45min". Null/undefined → "—". */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return '—';
  if (minutes < 60) return `~${minutes}min`;
  const h = Math.round((minutes / 60) * 10) / 10;
  return `~${Number.isInteger(h) ? h : h.toFixed(1)}h`;
}
