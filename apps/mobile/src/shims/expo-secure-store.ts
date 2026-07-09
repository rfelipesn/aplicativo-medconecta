// Web shim for expo-secure-store — no secure storage on web; fall back to
// in-memory storage (dev-only). Tokens won't persist across reloads.
const memoryStore = new Map<string, string>();

export async function getItemAsync(key: string): Promise<string | null> {
  return memoryStore.get(key) ?? null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  memoryStore.set(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  memoryStore.delete(key);
}

export default { getItemAsync, setItemAsync, deleteItemAsync };
