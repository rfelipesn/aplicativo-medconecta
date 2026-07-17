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

/** Gera URL assinada para UPLOAD (front faz PUT direto no Storage).
 *  Retorna a URL ABSOLUTA (https://<project>.supabase.co/storage/v1/...) para
 *  que o browser possa fazer PUT direto no Storage sem passar pelo nosso Nginx.
 */
export async function createSignedUploadUrl(
  bucket: string,
  path: string,
): Promise<{ signedUrl: string; token: string }> {
  // Endpoint correto: POST /storage/v1/object/upload/sign/{bucket}/{path}
  // (a ordem é /upload/sign/, não /sign/upload/ — esse último retorna 404).
  const res = await fetch(`${base()}/object/upload/sign/${bucket}/${path}`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const detail = (err.message as string) ?? res.status;
    throw new Error(
      `Storage upload failed — bucket:${bucket} path:${path} — ${detail}`,
    );
  }
  const data = (await res.json()) as { url: string; token: string };
  // O Supabase retorna { url: "/object/upload/sign/...?token=...", token }.
  // url é RELATIVO ao /storage/v1/. Precisamos juntar com a SUPABASE_URL
  // para que o browser faça PUT direto no Supabase, não no nosso Nginx.
  const absoluteUrl = `${env.SUPABASE_URL}/storage/v1${data.url}`;
  return { signedUrl: absoluteUrl, token: data.token };
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
    const detail = (err.message as string) ?? res.status;
    throw new Error(
      `Storage download failed — bucket:${bucket} path:${path} — ${detail}`,
    );
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
