import { type APIRequestContext, type Page, expect } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3333';

/** Gera um CPF aleatório de 11 dígitos (sem validação de dígitos verificadores). */
export function randomCpf(): string {
  let s = '';
  for (let i = 0; i < 11; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

/** Gera um telefone aleatório no formato E.164 (55 + DDD de 2 dígitos + 9 dígitos). */
export function randomPhone(): string {
  const ddd = String(Math.floor(Math.random() * 90) + 10);
  const rest = String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0');
  return `55${ddd}${rest}`;
}

/** Email único baseado em timestamp + random. */
export function uniqueEmail(prefix: string): string {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${stamp}@e2e.medconecta.local`;
}

/** Soma `n` anos a uma data e devolve YYYY-MM-DD. */
export function isoDateNDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Senha inicial do paciente: data de nascimento DDMMAAAA. */
export function dobToPassword(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}${m}${y}`;
}

export interface DoctorRegisterPayload {
  fullName: string;
  cpf: string;
  phone: string;
  email: string;
  password: string;
  specialization: string;
  crmNumber: string;
}

export interface PatientCreatePayload {
  fullName: string;
  cpf: string;
  phone: string;
  dateOfBirth: string; // YYYY-MM-DD
  email?: string;
}

export interface PatientCredentials {
  login: string;
  password: string;
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'doctor' | 'patient';
    doctor?: { id: string; specialization: string; crmNumber: string } | null;
    patient?: { id: string; doctorId: string } | null;
  };
}

export interface DemandsResponse {
  demands: Array<{
    id: string;
    type: string;
    status: string;
    priority?: string | null;
    title?: string | null;
    description: string;
    createdAt: string;
    patient?: { id: string; user: { fullName: string; phone?: string } } | null;
  }>;
  total: number;
}

export interface CreateDemandResponse {
  ok: boolean;
  demand: { id: string; type: string; status: string; description: string };
}

export interface LoginPatientResponse {
  ok: boolean;
  accessToken: string;
  refreshToken: string;
  user: { id: string; role: 'patient' };
}

// ─── UI helpers ─────────────────────────────────────────────────────────────

/**
 * Acessa a tela de auth, clica em "Criar conta (médico)", preenche o formulário
 * de registro de médico e submete. Espera o Dashboard carregar.
 *
 * @returns payload usado no registro (útil para o restante do teste).
 */
export async function registerDoctor(
  page: Page,
  payload: DoctorRegisterPayload,
): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'MEDconecta' })).toBeVisible();

  // Aba "Criar conta (médico)" — botão com o texto exato do AuthScreen.
  await page.getByRole('button', { name: 'Criar conta (médico)' }).click();

  await page.getByLabel('Nome completo').fill(payload.fullName);
  await page.getByLabel('CPF').fill(payload.cpf);
  await page.getByLabel('Telefone').fill(payload.phone);
  await page.getByLabel('Especialidade').fill(payload.specialization);
  await page.getByLabel('CRM').fill(payload.crmNumber);
  await page.getByLabel('E-mail').fill(payload.email);
  await page.getByLabel('Senha').fill(payload.password);

  await page.getByRole('button', { name: 'Criar conta' }).click();

  // Após o registro, o AuthScreen faz signInWithPassword e o App troca para
  // o Dashboard. O Dashboard mostra o cabeçalho com a especialidade.
  await expect(page.getByText(payload.specialization, { exact: false })).toBeVisible({
    timeout: 30_000,
  });
}

/**
 * Loga um médico já existente (e-mail + senha) pela UI.
 * Após o login, espera o Dashboard aparecer.
 */
export async function loginAsDoctor(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'MEDconecta' })).toBeVisible();

  // Garante que estamos na aba "Entrar" (seleciona a aba pelo seu tipo de classe).
  const loginTab = page.locator('button.auth-tab').filter({ hasText: 'Entrar' });
  await loginTab.click();

  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.locator('form button[type="submit"]').click();

  // O Dashboard mostra o cabeçalho com "Sair" no canto superior direito.
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible({ timeout: 30_000 });
}

/**
 * Preenche o formulário de cadastro de paciente no Dashboard, submete, espera
 * o card de credenciais aparecer e devolve o login (CPF) + senha (DDMMAAAA).
 */
export async function cadastrarPaciente(
  page: Page,
  payload: PatientCreatePayload,
): Promise<PatientCredentials> {
  await page.getByLabel('Nome completo').fill(payload.fullName);
  await page.getByLabel('CPF').fill(payload.cpf);
  await page.getByLabel('Telefone').fill(payload.phone);
  await page.locator('input[type="date"]').fill(payload.dateOfBirth);
  if (payload.email) {
    await page.getByLabel('E-mail (opcional)').fill(payload.email);
  }

  await page.getByRole('button', { name: 'Cadastrar paciente' }).click();

  // Espera o box de credenciais.
  const credBox = page.locator('.credentials-box');
  await expect(credBox).toBeVisible({ timeout: 30_000 });

  const login = (await credBox.locator('code').nth(0).innerText()).trim();
  const password = (await credBox.locator('code').nth(1).innerText()).trim();

  return { login, password };
}

// ─── API helpers ────────────────────────────────────────────────────────────

/**
 * Login direto na API: paciente (CPF + data de nascimento DDMMAAAA).
 * Retorna o `access_token` para chamadas autenticadas subsequentes.
 */
export async function loginAsPatientAPI(
  request: APIRequestContext,
  cpf: string,
  dobAsDdMmAaaa: string,
): Promise<string> {
  const res = await request.post(`${API_URL}/auth/login/patient`, {
    data: { cpf, birthDate: dobAsDdMmAaaa },
  });
  expect(res.ok(), `login paciente (${res.status()})`).toBeTruthy();
  const body = (await res.json()) as LoginPatientResponse;
  expect(body.ok).toBe(true);
  expect(body.accessToken).toBeTruthy();
  return body.accessToken;
}

/** GET /me autenticado com Bearer token. */
export async function getMe(
  request: APIRequestContext,
  token: string,
): Promise<MeResponse> {
  const res = await request.get(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok(), `GET /me (${res.status()})`).toBeTruthy();
  return (await res.json()) as MeResponse;
}

/** POST /demands autenticado. */
export async function createDemand(
  request: APIRequestContext,
  token: string,
  data: { type: string; description: string; title?: string; priority?: string },
): Promise<CreateDemandResponse> {
  const res = await request.post(`${API_URL}/demands`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  expect(res.ok(), `POST /demands (${res.status()})`).toBeTruthy();
  return (await res.json()) as CreateDemandResponse;
}

/** GET /demands autenticado. */
export async function listDemands(
  request: APIRequestContext,
  token: string,
  query: Record<string, string> = {},
): Promise<DemandsResponse> {
  const qs = new URLSearchParams(query).toString();
  const res = await request.get(`${API_URL}/demands${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok(), `GET /demands (${res.status()})`).toBeTruthy();
  return (await res.json()) as DemandsResponse;
}

/** PATCH /demands/:id/respond (médico). */
export async function respondDemand(
  request: APIRequestContext,
  token: string,
  demandId: string,
  status: 'responded' | 'closed' | 'pending_action',
  responseNotes?: string,
): Promise<void> {
  const res = await request.patch(`${API_URL}/demands/${demandId}/respond`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { status, ...(responseNotes ? { responseNotes } : {}) },
  });
  expect(res.ok(), `PATCH /demands/:id/respond (${res.status()})`).toBeTruthy();
}

/** Gera um payload completo de médico com dados únicos. */
export function makeDoctorPayload(): DoctorRegisterPayload {
  return {
    fullName: `Dra. E2E ${Date.now()}`,
    cpf: randomCpf(),
    phone: randomPhone(),
    email: uniqueEmail('doctor'),
    password: 'MedE2E-2026!',
    specialization: 'Neurologia',
    crmNumber: `CRM-E2E-${Date.now()}`,
  };
}

/** Gera um payload completo de paciente com dados únicos. */
export function makePatientPayload(): PatientCreatePayload {
  return {
    fullName: `Paciente E2E ${Date.now()}`,
    cpf: randomCpf(),
    phone: randomPhone(),
    dateOfBirth: isoDateNDaysAgo(30 * 365 + Math.floor(Math.random() * 30)), // ~30 anos
    // Email omitido: o backend gera `paciente-{cpf}@app.medconecta.app` via cpfToEmail.
  };
}
