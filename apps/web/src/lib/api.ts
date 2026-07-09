import { supabase } from './supabase';
import { env } from '../env';

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

class ApiError extends Error {
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

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${env.apiUrl}${path}`, {
    headers: { ...(await authHeaders()) },
  });
  return handle<T>(res, path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${env.apiUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  return handle<T>(res, path);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${env.apiUrl}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  return handle<T>(res, path);
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${env.apiUrl}${path}`, {
    method: 'DELETE',
    headers: { ...(await authHeaders()) },
  });
  return handle<T>(res, path);
}

export { ApiError };
