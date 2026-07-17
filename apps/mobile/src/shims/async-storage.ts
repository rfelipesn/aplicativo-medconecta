// Web shim for @react-native-async-storage/async-storage — uses localStorage.
interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

function getStorage(): StorageLike | undefined {
  return (globalThis as unknown as { localStorage?: StorageLike }).localStorage;
}

export async function getItem(key: string): Promise<string | null> {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    getStorage()?.setItem(key, value);
  } catch {
    // ignore
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    getStorage()?.removeItem(key);
  } catch {
    // ignore
  }
}

export async function multiGet(keys: string[]): Promise<[string, string | null][]> {
  const result: [string, string | null][] = [];
  for (const key of keys) {
    result.push([key, await getItem(key)]);
  }
  return result;
}

export async function multiSet(entries: [string, string][]): Promise<void> {
  for (const [key, value] of entries) {
    await setItem(key, value);
  }
}

export async function multiRemove(keys: string[]): Promise<void> {
  for (const key of keys) {
    await removeItem(key);
  }
}

export async function clear(): Promise<void> {
  try {
    getStorage()?.clear();
  } catch {
    // ignore
  }
}

export default { getItem, setItem, removeItem, multiGet, multiSet, multiRemove, clear };
