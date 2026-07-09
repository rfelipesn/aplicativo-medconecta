import { test, expect } from '@playwright/test';
import {
  cadastrarPaciente,
  createDemand,
  dobToPassword,
  listDemands,
  loginAsDoctor,
  loginAsPatientAPI,
  makeDoctorPayload,
  makePatientPayload,
  registerDoctor,
  respondDemand,
} from './helpers';

// Estes testes escrevem no Supabase real configurado em .env. Cada teste
// gera dados únicos (timestamp + random) para evitar colisão de CPF/e-mail.
//
// PRÉ-REQUISITOS:
//  1. .env preenchido com SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//     e DATABASE_URL válidos.
//  2. API rodando (ou `webServer` em playwright.config.ts cuidará disso).
//  3. Web (Vite) rodando (idem).
//
// Para pular um teste pontual, use `test.skip()`.

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3333';

/**
 * Pré-condição compartilhada: verifica se o Supabase configurado está acessível.
 * Se o DNS falhar ou o projeto estiver pausado, pula TODOS os testes com mensagem
 * clara em vez de derrubar a suíte com erros genéricos de 500.
 */
async function checkSupabaseReachable(): Promise<boolean> {
  // 1) Tenta carregar do .env da API se não estiver no ambiente
  let url = process.env.SUPABASE_URL;
  if (!url) {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const envPath = path.resolve('services/api/.env');
      if (fs.existsSync(envPath)) {
        const text = fs.readFileSync(envPath, 'utf8');
        const m = text.match(/^SUPABASE_URL\s*=\s*"?([^"\n]+)"?/m);
        if (m) url = m[1].trim();
      }
    } catch {
      // ignore
    }
  }
  if (!url) return false;

  // 2) Faz fetch direto (sem depender do request context do Playwright).
  //    Aceita 2xx e 401 (Supabase pode exigir API key para /health).
  //    O que importa é que o DNS resolveu e o servidor respondeu.
  try {
    const healthUrl = `${url.replace(/\/$/, '')}/auth/v1/health`;
    const res = await fetch(healthUrl, { method: 'GET' });
    return res.status >= 200 && res.status < 500;
  } catch {
    return false;
  }
}

test.beforeAll(async () => {
  const ok = await checkSupabaseReachable();
  if (!ok) {
    test.skip(
      true,
      'Supabase não está acessível (DNS falhou, projeto pausado ou credenciais inválidas). ' +
        'Verifique SUPABASE_URL em services/api/.env e o status do projeto no painel Supabase.',
    );
  }
});

test.describe('Fluxo principal médico', () => {
  test('cadastro de paciente via UI: fluxo de provisionamento presencial', async ({ page, request }) => {
    // Este teste cobre o CAMINHO DA UI do médico: o pré-requisito (login do
    // médico) é feito via API + injeção de sessão no navegador, porque o
    // login pela UI depende do supabase-js que não consegue resolver emails
    // internos do Auth. Já o cadastro de paciente é 100% via UI.
    const doctor = makeDoctorPayload();

    // 1) Cadastra médico via API.
    const regRes = await request.post(`${API_URL}/auth/register/doctor`, {
      data: {
        fullName: doctor.fullName,
        cpf: doctor.cpf,
        phone: doctor.phone,
        email: doctor.email,
        password: doctor.password,
        specialization: doctor.specialization,
        crmNumber: doctor.crmNumber,
      },
    });
    expect(regRes.ok(), `register doctor (${regRes.status()})`).toBeTruthy();

    // 2) Login via API + injeção de sessão no localStorage.
    const docLogin = await request.post(`${API_URL}/auth/login`, {
      data: { email: doctor.email, password: doctor.password },
    });
    expect(docLogin.ok(), `login doctor API (${docLogin.status()})`).toBeTruthy();
    const { accessToken: doctorToken, refreshToken } = (await docLogin.json()) as {
      accessToken: string;
      refreshToken: string;
    };

    const projectUrl = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
    const storageKey = `sb-${new URL(projectUrl).hostname.split('.')[0]}-auth-token`;
    const sessionPayload = {
      access_token: doctorToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: '', email: doctor.email, role: 'authenticated' },
    };
    await page.goto('/');
    await page.evaluate(
      ({ key, value }) => {
        localStorage.setItem(key, JSON.stringify(value));
      },
      { key: storageKey, value: sessionPayload },
    );
    await page.reload();
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible({ timeout: 30_000 });

    // 3) Cadastra paciente pela UI (caminho do médico presencial).
    const patient = makePatientPayload();
    const credentials = await cadastrarPaciente(page, patient);
    expect(credentials.login).toBe(patient.cpf);
    expect(credentials.password).toBe(dobToPassword(patient.dateOfBirth));
  });
});

test.describe('Fluxo paciente cria demanda', () => {
  test('paciente autenticado cria demanda via API e médico recebe', async ({ request }) => {
    // 1) Cria médico via API (não depende da UI).
    const doctor = makeDoctorPayload();
    const regRes = await request.post(`${API_URL}/auth/register/doctor`, {
      data: {
        fullName: doctor.fullName,
        cpf: doctor.cpf,
        phone: doctor.phone,
        email: doctor.email,
        password: doctor.password,
        specialization: doctor.specialization,
        crmNumber: doctor.crmNumber,
      },
    });
    expect(regRes.ok(), `register doctor (${regRes.status()})`).toBeTruthy();

    // Login do médico (necessário para cadastrar paciente — exige Bearer).
    const docLogin = await request.post(`${API_URL}/auth/login`, {
      data: { email: doctor.email, password: doctor.password },
    });
    expect(docLogin.ok(), `login doctor (${docLogin.status()})`).toBeTruthy();
    const { accessToken: doctorToken } = (await docLogin.json()) as { accessToken: string };

    // 2) Médico cadastra paciente.
    const patient = makePatientPayload();
    const createPatient = await request.post(`${API_URL}/patients`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
      data: {
        fullName: patient.fullName,
        cpf: patient.cpf,
        phone: patient.phone,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth,
      },
    });
    if (!createPatient.ok()) {
      const body = await createPatient.text();
      throw new Error(`create patient (${createPatient.status()}): ${body}`);
    }
    const created = (await createPatient.json()) as {
      ok: boolean;
      credentials: { login: string; password: string };
    };
    expect(created.ok).toBe(true);
    expect(created.credentials.login).toBe(patient.cpf);
    expect(created.credentials.password).toBe(dobToPassword(patient.dateOfBirth));

    // Pequena pausa para o Supabase Auth replicar internamente após a criação.
    await new Promise((r) => setTimeout(r, 500));

    // 3) Login do paciente (CPF + data de nascimento DDMMAAAA).
    const patientToken = await loginAsPatientAPI(
      request,
      patient.cpf,
      created.credentials.password,
    );
    expect(patientToken).toBeTruthy();

    // 4) Paciente cria demanda.
    const created2 = await createDemand(request, patientToken, {
      type: 'recipe_renewal',
      title: 'Renovação de receita (e2e)',
      description: 'Preciso renovar minha receita mensal de Topiramato.',
    });
    expect(created2.ok).toBe(true);
    expect(created2.demand.status).toBe('open');
    expect(created2.demand.type).toBe('recipe_renewal');

    // 5) Médico lista demandas (todas) e encontra a criada.
    const all = await listDemands(request, doctorToken);
    const found = all.demands.find((d) => d.id === created2.demand.id);
    expect(found, 'demanda do paciente deve aparecer para o médico').toBeDefined();
    expect(found?.description).toContain('Topiramato');

    // 6) Médico responde; o status muda e some da lista "open".
    await respondDemand(request, doctorToken, created2.demand.id, 'responded', 'Receita renovada.');
    const openAfter = await listDemands(request, doctorToken, { status: 'open' });
    const stillOpen = openAfter.demands.find((d) => d.id === created2.demand.id);
    expect(stillOpen, 'demanda não pode mais estar em "open"').toBeUndefined();

    const respondedAfter = await listDemands(request, doctorToken, { status: 'responded' });
    const nowResponded = respondedAfter.demands.find((d) => d.id === created2.demand.id);
    expect(nowResponded, 'demanda deve aparecer em "responded"').toBeDefined();
  });
});
