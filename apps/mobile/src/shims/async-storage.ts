// Web shim for @react-native-async-storage/async-storage — uses localStorage.
export async function getItem(key: string): Promise<string | null> {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    localStorage.removeItem(key);
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
    localStorage.clear();
  } catch {
    // ignore
  }
}

export default { getItem, setItem, removeItem, multiGet, multiSet, multiRemove, clear };
