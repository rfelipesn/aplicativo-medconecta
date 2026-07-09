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

/** Lê um valor string do storage seguro. Retorna `null` se ausente. */
export async function secureGet(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

/** Persiste um valor string no storage seguro. */
export async function secureSet(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

/** Remove uma chave do storage seguro. */
export async function secureDelete(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
