import * as SecureStore from 'expo-secure-store';

/**
 * Adapter de storage seguro para a sessão do Supabase Auth.
 * Guarda o refresh token no Keychain (iOS) / Keystore (Android).
 */
export const secureStorageAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
