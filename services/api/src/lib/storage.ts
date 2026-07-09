import { env } from '../env.js';

function base() {
  if (!env.SUPABASE_URL) throw new Error('SUPABASE_URL não configurado');
  return `${env.SUPABASE_URL}/storage/v1`;
}

function adminHeaders() {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurado');
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

/** Gera URL assinada para UPLOAD (front faz PUT direto no Storage). */
export async function createSignedUploadUrl(
  bucket: string,
  path: string,
): Promise<{ signedUrl: string; token: string }> {
  // Supabase Storage requer Content-Type: application/json com body não-vazio.
  const res = await fetch(`${base()}/object/sign/upload/${bucket}/${path}`, {
    method: 'POST',
    headers: adminHeaders(),
    body: '{}',
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error((err.message as string) ?? `Storage sign-upload failed: ${res.status}`);
  }
  return res.json() as Promise<{ signedUrl: string; token: string }>;
}

/** Gera URL assinada para DOWNLOAD (expiração em segundos). */
export async function createSignedDownloadUrl(
  bucket: string,
  path: string,
  expiresIn = 3600,
): Promise<string> {
  const res = await fetch(`${base()}/object/sign/${bucket}/${path}`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ expiresIn }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error((err.message as string) ?? `Storage sign-download failed: ${res.status}`);
  }
  const data = (await res.json()) as { signedUrl: string };
  return data.signedUrl;
}

/** Remove um objeto do Storage (cleanup em caso de rollback). */
export async function deleteStorageObject(bucket: string, path: string): Promise<void> {
  await fetch(`${base()}/object/${bucket}/${path}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
}

/**
 * Baixa o binário de um objeto do Storage via URL assinada temporária.
 * Accepts:
 *  - http(s) URL  -> fetch direto (signed URL externa, ex.: áudios do front)
 *  - path relativo "bucket/path" -> gera signed URL via service role e baixa.
 */
export async function downloadAudioBuffer(ref: string): Promise<{
  buffer: Buffer;
  contentType: string | null;
}> {
  let url: string;
  if (/^https?:\/\//i.test(ref)) {
    url = ref;
  } else {
    const idx = ref.indexOf('/');
    if (idx <= 0) throw new Error('Referência de áudio inválida (esperado "bucket/path").');
    const bucket = ref.slice(0, idx);
    const path = ref.slice(idx + 1);
    url = await createSignedDownloadUrl(bucket, path, 300);
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao baixar áudio: status ${res.status}`);
  }
  const arrayBuf = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuf),
    contentType: res.headers.get('content-type'),
  };
}
