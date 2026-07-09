import * as FileSystem from 'expo-file-system';
import { apiPost } from '../lib/api';

export async function uploadAudioFile(patientId: string, localPath: string): Promise<string> {
  const filename = localPath.split('/').pop() ?? `audio_${Date.now()}.m4a`;

  const { signedUrl, downloadUrl } = await apiPost<{
    signedUrl: string;
    downloadUrl: string;
    path: string;
  }>(`/patients/${patientId}/audio/upload-url`, {
    filename,
    mimeType: 'audio/m4a',
  });

  const fileInfo = await FileSystem.getInfoAsync(localPath);
  if (!fileInfo.exists) {
    throw new Error('Arquivo de áudio não encontrado');
  }

  const uploadRes = await FileSystem.uploadAsync(signedUrl, localPath, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { 'Content-Type': 'audio/m4a' },
  });

  if (uploadRes.status < 200 || uploadRes.status >= 300) {
    throw new Error(`Upload de áudio falhou: ${uploadRes.status}`);
  }

  return downloadUrl;
}
