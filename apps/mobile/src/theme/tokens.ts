/**
 * Design tokens do MEDconecta (app do paciente).
 *
 * Estética inspirada em apps de saúde premium estilo iOS/Apple Health:
 * branco quente, cartões muito arredondados, sombras suaves, ícones
 * coloridos por categoria e tipografia limpa. A cor de marca é o teal
 * #85B7BF (RGB 133,183,191); sobre teal usamos texto ESCURO (`onPrimary`).
 *
 * Reutilizável entre telas — importe `T` e use os tokens em vez de
 * hardcodar cores/raios/sombras.
 */
export const T = {
  color: {
    // Fundos
    bg: '#F6F7F4', // branco quente / off-white
    surface: '#FFFFFF',
    surfaceMuted: '#F1F3F0',

    // Texto (escala tipo iOS)
    text: '#1C1C1E',
    textSecondary: '#6B7280',
    textTertiary: '#9AA2AC',

    separator: '#ECEEEA',

    // Marca (teal)
    primary: '#85B7BF',
    primaryDark: '#2E6B73',
    onPrimary: '#0F3B41',
    primarySoft: '#E9F3F4',

    // Acentos por categoria (harmonizados com o teal)
    red: '#E9756B',
    redSoft: '#FCECEA',
    orange: '#E8A15C',
    orangeSoft: '#FBF0E2',
    teal: '#5AA0A8',
    tealSoft: '#E4F1F2',
    purple: '#9C8BC4',
    purpleSoft: '#F0ECF8',
    green: '#5FAE86',
    greenSoft: '#E6F4EC',
    blue: '#6FA0CC',
    blueSoft: '#EAF1F8',
    white: '#FFFFFF',
  },
  radius: { sm: 12, md: 16, lg: 22, xl: 28, pill: 999 },
  space: { xs: 6, sm: 10, md: 16, lg: 20, xl: 28 },
  font: {
    largeTitle: 30,
    title: 22,
    headline: 17,
    body: 15,
    subhead: 13,
    caption: 11,
  },
  /** Sombra suave e discreta para cartões elevados. */
  shadow: {
    card: {
      shadowColor: '#1C1C1E',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    soft: {
      shadowColor: '#1C1C1E',
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
  },
} as const;
