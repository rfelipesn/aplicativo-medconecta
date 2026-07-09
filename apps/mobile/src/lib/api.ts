import { supabase } from './supabase';
import { env } from '../config/env';

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handle<T>(res: Response, path: string): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      (data.message as string) || (data.error as string) || `${path} (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

async function refreshSession(): Promise<boolean> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) return false;
  return true;
}

async function fetchWithAuth<T>(
  path: string,
  init: RequestInit & { parse?: boolean },
): Promise<T> {
  const res = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: { ...(await authHeaders()), ...(init.headers ?? {}) },
  });

  // 401: tenta refresh uma única vez e refaz a requisição.
  if (res.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      const retryRes = await fetch(`${env.apiUrl}${path}`, {
        ...init,
        headers: { ...(await authHeaders()), ...(init.headers ?? {}) },
      });
      return handle<T>(retryRes, path);
    }
  }

  return handle<T>(res, path);
}

export async function apiGet<T>(path: string): Promise<T> {
  return fetchWithAuth<T>(path, {});
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return fetchWithAuth<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return fetchWithAuth<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export type ChangePasswordResponse = {
  ok: true;
  mustChangePassword: false;
  session: { access_token: string; refresh_token: string };
};

/**
 * Troca a senha obrigatória do paciente e injeta imediatamente a nova sessão
 * devolvida pelo backend no Supabase, evitando que o access_token antigo
 * (invalidado pela alteração de senha) cause 401/loop no refetch de /me.
 */
export async function apiChangePassword(newPassword: string): Promise<void> {
  const result = await apiPost<ChangePasswordResponse>('/me/change-password', { newPassword });
  if (result?.session?.access_token) {
    const { error } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });
    if (error) {
      // Última tentativa: força refresh com o refresh_token novo.
      await supabase.auth.refreshSession();
    }
  }
}
