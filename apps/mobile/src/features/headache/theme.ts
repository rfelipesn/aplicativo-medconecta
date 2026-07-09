/**
 * Tema do módulo Diário de Cefaleia.
 *
 * Paleta OFICIAL do MEDconecta: branco + teal #85B7BF (RGB 133,183,191).
 * Como o teal é claro, botões preenchidos usam texto ESCURO (`onPrimary`)
 * para garantir contraste/legibilidade.
 *
 * Os tons "primaryMid/primaryLight" são derivados do teal primário para os
 * gráficos de severidade e para o círculo de intensidade animado.
 */
export const HT = {
  primary: '#85B7BF',
  primaryMid: '#5E9AA3',
  primaryLight: '#B3D4D9',
  primarySoft: '#EAF4F5',

  // Texto/ícone escuro para uso SOBRE o teal (botões cheios, destaques).
  onPrimary: '#0F3B41',
  primaryDark: '#2E6B73',

  screenBg: '#F5F7FA',
  wizardBg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F5',

  text: '#333333',
  muted: '#6B7B8D',
  mutedLight: '#B6C0CC',

  border: '#DDE3EA',
  borderActive: '#85B7BF',

  // Cores auxiliares para gráficos (família teal, on-brand).
  chartStrong: '#4E8A93',
  chartMid: '#7FB0B8',
  chartLight: '#CFE3E6',

  success: '#1E8449',
  white: '#FFFFFF',
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
