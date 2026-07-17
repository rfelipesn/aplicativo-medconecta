import { apiPost } from './api';

export interface UploadResult {
  storagePath: string;
}

/**
 * Faz upload de um arquivo para o Supabase Storage via signed URL.
 *
 * Fluxo padronizado (única implementação para TODOS os uploads):
 *   1. POST /sign-upload  → backend retorna { signedUrl, storagePath }
 *   2. PUT  {signedUrl}   → upload direto no Supabase Storage
 *
 * @param signUploadEndpoint rota da API que gera a signed URL (ex.: '/patients/:id/documents/sign-upload')
 * @param signPayload       payload enviado ao sign-upload (filename, mimeType, documentType, etc.)
 * @param file              File/Blob a enviar
 * @param onProgress        callback opcional de progresso (0..1)
 * @returns                 { storagePath } retornado pela API
 * @throws                  Error com mensagem clara em PT-BR se algo falhar
 */
export async function uploadFileViaSignedUrl(
  signUploadEndpoint: string,
  signPayload: Record<string, unknown>,
  file: File | Blob,
  fileName?: string,
): Promise<UploadResult> {
  const name = fileName ?? (file instanceof File ? file.name : 'upload');

  // 1. Solicita URL assinada ao backend
  const signed = await apiPost<{ signedUrl: string; storagePath: string }>(
    signUploadEndpoint,
    { ...signPayload, filename: name, mimeType: (file as File).type || 'application/octet-stream' },
  );
  if (!signed.signedUrl || !signed.signedUrl.startsWith('http')) {
    throw new Error(
      `Backend retornou signedUrl inválida: ${signed.signedUrl?.slice(0, 60) ?? '(vazio)'}. ` +
        'Esperava URL absoluta começando com https://. Verifique se a API foi rebuildada.',
    );
  }

  // 2. PUT direto no Supabase Storage com a URL absoluta
  const putRes = await fetch(signed.signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': (file as File).type || 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: file,
  });
  if (!putRes.ok) {
    let detail = '';
    try {
      detail = (await putRes.text()).slice(0, 200);
    } catch {
      /* ignore */
    }
    throw new Error(
      `Upload falhou no Storage (HTTP ${putRes.status}${detail ? ` — ${detail}` : ''}). ` +
        'Verifique sua conexão e tente novamente.',
    );
  }

  return { storagePath: signed.storagePath };
}