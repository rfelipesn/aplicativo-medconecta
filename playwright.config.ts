import { defineConfig, devices } from '@playwright/test';

const API_PORT = process.env.API_PORT ?? '3333';
const WEB_PORT = process.env.WEB_PORT ?? '5173';

export default defineConfig({
  testDir: './e2e',
  // Cada arquivo/spec roda em worker isolado; o estado compartilhado (Supabase)
  // exige serialização entre fluxos que escrevem no mesmo banco. Mantemos
  // workers=1 quando rodando em CI para evitar contenção; localmente, o default
  // paralelo do Playwright é aceitável porque cada teste cria seu próprio
  // médico/paciente com dados únicos (timestamp).
  fullyParallel: !process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:api',
      url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev:web',
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
