import { env } from '../env.js';

/**
 * Cliente mínimo do Supabase Auth (admin) via REST/fetch.
 * Evita dependência extra (@supabase/supabase-js) no backend.
 *
 * - service_role: operações administrativas (criar/remover usuário).
 * - anon: troca de senha por sessão (login).
 */

const AUTH_BASE = () => `${env.SUPABASE_URL}/auth/v1`;

export class SupabaseAuthError extends Error {
  status: number;
  details: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'SupabaseAuthError';
    this.status = status;
    this.details = details;
  }
}

function assertConfigured(): { url: string; serviceKey: string; anonKey: string } {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_ANON_KEY) {
    throw new SupabaseAuthError('Supabase não configurado (URL/keys ausentes).', 500);
  }
  return {
    url: env.SUPABASE_URL,
    serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: env.SUPABASE_ANON_KEY,
  };
}

function adminHeaders() {
  const { serviceKey } = assertConfigured();
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };
}

function anonHeaders() {
  const { anonKey } = assertConfigured();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };
}

export interface AuthUser {
  id: string;
  email?: string;
}

export async function createAuthUser(input: {
  email: string;
  password: string;
  userMetadata?: Record<string, unknown>;
}): Promise<AuthUser> {
  const res = await fetch(`${AUTH_BASE()}/admin/users`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: input.userMetadata ?? {},
    }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (data.msg as string) ||
      (data.error_description as string) ||
      (data.message as string) ||
      `status ${res.status}`;
    throw new SupabaseAuthError(msg, res.status, data);
  }
  return { id: data.id as string, email: data.email as string | undefined };
}

export async function deleteAuthUser(id: string): Promise<void> {
  await fetch(`${AUTH_BASE()}/admin/users/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
}

/** Atualiza a senha de um usuário no Supabase Auth (service role). */
export async function updateUserPassword(userId: string, password: string): Promise<void> {
  const res = await fetch(`${AUTH_BASE()}/admin/users/${userId}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const msg =
      (data.msg as string) ||
      (data.error_description as string) ||
      (data.message as string) ||
      `status ${res.status}`;
    throw new SupabaseAuthError(msg, res.status, data);
  }
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user?: { id: string; email?: string };
}

/**
 * Valida um access_token do usuário chamando GET /auth/v1/user.
 * Retorna o usuário se o token for válido, ou null caso contrário.
 * (Sem dependência de lib de JWT; o próprio GoTrue valida a assinatura.)
 */
export async function getAuthUserFromToken(token: string): Promise<AuthUser | null> {
  const { anonKey } = assertConfigured();
  const res = await fetch(`${AUTH_BASE()}/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data || typeof data.id !== 'string') return null;
  return { id: data.id, email: data.email as string | undefined };
}

export async function signInWithPassword(input: {
  email: string;
  password: string;
}): Promise<Session> {
  const res = await fetch(`${AUTH_BASE()}/token?grant_type=password`, {
    method: 'POST',
    headers: anonHeaders(),
    body: JSON.stringify({ email: input.email, password: input.password }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (data.error_description as string) || (data.msg as string) || 'login_failed';
    throw new SupabaseAuthError(msg, res.status, data);
  }
  return data as unknown as Session;
}
