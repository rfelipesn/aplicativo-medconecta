/**
 * Tema do módulo Diário de Cefaleia — alinhado ao Fluent Accent (tokens T).
 */
import { T } from '../../theme/tokens';

export const HT = {
  primary: T.color.primaryStrong,
  primaryMid: T.color.primary,
  primaryLight: T.color.primaryMid,
  primarySoft: T.color.primarySoft,

  onPrimary: T.color.onPrimary,
  primaryDark: T.color.primaryDark,

  screenBg: T.color.bg,
  wizardBg: T.color.surface,
  surface: T.color.surface,
  surfaceMuted: T.color.surfaceMuted,

  text: T.color.text,
  muted: T.color.textTertiary,
  mutedLight: '#A4B9BD',

  border: T.color.separator,
  borderActive: T.color.primary,

  chartStrong: T.color.primaryStrong,
  chartMid: T.color.primary,
  chartLight: '#D7ECEE',

  success: T.color.green,
  white: T.color.white,
  orange: T.color.orange,
  purple: T.color.purple,
  blue: T.color.blue,
  red: T.color.red,
} as const;

/** Interpola dois hex (#RRGGBB) por t∈[0,1]. */
export function lerpColor(a: string, b: string, t: number): string {
  const ah = a.replace('#', '');
  const bh = b.replace('#', '');
  const ar = parseInt(ah.slice(0, 2), 16);
  const ag = parseInt(ah.slice(2, 4), 16);
  const ab = parseInt(ah.slice(4, 6), 16);
  const br = parseInt(bh.slice(0, 2), 16);
  const bg = parseInt(bh.slice(2, 4), 16);
  const bb = parseInt(bh.slice(4, 6), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl
    .toString(16)
    .padStart(2, '0')}`;
}

/** Cor por nível de intensidade para gráficos de severidade. */
export function severityColor(level: 'leve' | 'moderado' | 'severo'): string {
  if (level === 'leve') return HT.primaryLight;
  if (level === 'moderado') return HT.primaryMid;
  return HT.primary;
}
