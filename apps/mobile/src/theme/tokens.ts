/**
 * MEDconecta — Fluent Accent tokens (app do paciente).
 *
 * Fonte de verdade: mockup "Mockup L — Fluent Accent" + DESIGN.md.
 * Superfícies claras, azul-petróleo, cartões acrylic, acentos laranja/lilás.
 */
export const T = {
  color: {
    bg: '#F0F6F7',
    surface: '#FFFFFF',
    surfaceMuted: '#E8F2F3',
    surfaceSubtle: '#F7FAFA',
    acrylic: 'rgba(255,255,255,0.82)',
    acrylicStrong: 'rgba(255,255,255,0.94)',

    text: '#1A2A2D',
    textSecondary: '#52666B',
    textTertiary: '#6B7F84',

    separator: '#D8E7E9',
    border: 'rgba(133,183,191,0.30)',
    reveal: 'rgba(133,183,191,0.30)',
    overlay: 'rgba(15,59,65,0.42)',

    primary: '#85B7BF',
    primaryStrong: '#4E8E99',
    primaryDark: '#0F3B41',
    primarySoft: '#E8F2F3',
    primaryMid: '#B7D7DB',
    /** Texto sobre botão primaryStrong (teal saturado). */
    onPrimary: '#FFFFFF',
    /** Texto sobre primary claro (#85B7BF). */
    onPrimarySoft: '#0F3B41',

    red: '#FF5D5D',
    redSoft: '#FFE9E9',
    orange: '#FF9F45',
    orangeSoft: '#FFF0E1',
    teal: '#4E8E99',
    tealSoft: '#E8F2F3',
    purple: '#9D7BFF',
    purpleSoft: '#F0ECFF',
    green: '#34C98E',
    greenSoft: '#E4F8F0',
    blue: '#4E9EF5',
    blueSoft: '#E7F2FF',
    white: '#FFFFFF',

    glass: 'rgba(255,255,255,0.18)',
    glassBorder: 'rgba(255,255,255,0.26)',
    glassText: 'rgba(255,255,255,0.88)',
  },
  radius: { xs: 8, sm: 12, md: 14, lg: 16, xl: 22, xxl: 28, pill: 999 },
  space: { xxs: 4, xs: 6, sm: 10, md: 16, lg: 20, xl: 28, xxl: 36 },
  font: {
    largeTitle: 28,
    title: 22,
    headline: 17,
    body: 15,
    subhead: 13,
    caption: 11,
  },
  family: {
    regular: 'Segoe UI',
    display: 'Segoe UI',
  },
  shadow: {
    card: {
      shadowColor: '#0F3B41',
      shadowOpacity: 0.11,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    soft: {
      shadowColor: '#0F3B41',
      shadowOpacity: 0.07,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 1,
    },
    floating: {
      shadowColor: '#0F3B41',
      shadowOpacity: 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
  },
  gradient: {
    header: ['#4E8E99', '#85B7BF', '#E8F2F3'] as const,
    hero: ['#4E8E99', '#85B7BF'] as const,
    tabActive: ['#85B7BF', '#4E8E99'] as const,
  },
} as const;

export type Tokens = typeof T;
