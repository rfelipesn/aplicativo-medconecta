import Constants from 'expo-constants';
import { Platform } from 'react-native';

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  apiUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/**
 * Detecta automaticamente o IP da máquina de dev quando o app roda via Expo Go
 * no celular físico. Em emulador ou web, usa `localhost`.
 *
 * Você pode sobrescrever via `extra.apiUrl` no app.json OU pela variável de
 * ambiente `EXPO_PUBLIC_API_URL` (recomendado para emulador: `EXPO_PUBLIC_API_URL=http://10.0.2.2:3333` no Android).
 */
function detectDevApiUrl(): string {
  // Metro substitui `process.env.EXPO_PUBLIC_API_URL` literalmente durante o build.
  // Guardamos numa const para que a expressão fique como literal-truthy no bundle final
  // (o optional-chaining `?.` do padrão anterior impedia a substituição no check).
  // @ts-expect-error: process.env é resolvido pelo Metro bundler
  const envUrl = process.env.EXPO_PUBLIC_API_URL as string | undefined;
  if (envUrl) return envUrl;

  // Em nativo (Expo Go / standalone) o extra.apiUrl do app.json ainda funciona.
  if (extra.apiUrl) return extra.apiUrl;

  if (Platform.OS === 'web') {
    return 'http://localhost:3333';
  }
  // Em emulador Android, 10.0.2.2 = host. Em iOS, localhost funciona.
  return 'http://10.0.2.2:3333';
}

export const env = {
  supabaseUrl: extra.supabaseUrl ?? '',
  supabaseAnonKey: extra.supabaseAnonKey ?? '',
  apiUrl: detectDevApiUrl(),
};
