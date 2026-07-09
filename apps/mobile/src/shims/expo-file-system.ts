// Web shim for expo-file-system — no file system on web. Returns empty/null.
export const documentDirectory = null;

export async function readAsStringAsync(_fileUri: string): Promise<string> {
  return '';
}

export async function writeAsStringAsync(_fileUri: string, _content: string): Promise<void> {}

export async function deleteAsync(_fileUri: string): Promise<void> {}

export async function getInfoAsync(_fileUri: string): Promise<{ exists: boolean; size?: number }> {
  return { exists: false };
}

export async function makeDirectoryAsync(_dirUri: string): Promise<void> {}

export async function downloadAsync(_uri: string, _fileUri: string): Promise<void> {}

export default {
  documentDirectory,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  getInfoAsync,
  makeDirectoryAsync,
  downloadAsync,
};
