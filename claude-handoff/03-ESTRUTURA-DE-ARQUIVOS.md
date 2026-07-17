# Estrutura

`apps/mobile/src`: app paciente, navegação, telas, features de cefaleia/convulsão, APIs, Supabase, push, biometria e WatermelonDB. Entradas: `apps/mobile/index.ts`, `apps/mobile/src/App.tsx`.

`apps/web/src`: painel médico; `App.tsx`, `main.tsx`, `pages/*Panel.tsx`, `hooks`, `lib/api.ts`, `lib/supabase.ts`, `index.css`.

`services/api/src`: `server.ts`, rotas (`auth`, `chat`, `demands`, `headacheDiary`, `seizureDiary`, `patients`, `documents`, `exams`, `recipes`, `notifications`, `healthEventLog`, `assistants`, `audio`, `transcription`, `ai`), middleware de auth/assistantAccess, libs de audit/storage/notifications/push/supabase.

`packages/shared/src`: schemas e tipos de domínio. `packages/db`: Prisma e scripts de migration. `supabase/migrations`: schema/RLS/onboarding/push. `.github/workflows`: CI/deploy. Arquivos de deploy: `docker-compose.yml`, `railway.json`, `vercel.json`, `apps/*/netlify.toml`, nginx e entrypoints.

Também existem assets e referências de design em `diario de cefaleia/`, `MANUAL DA MARCA PARA ENVIO (1).pdf` e `app-mockup.canvas.tsx`. Não confundir `graphify-out`, `test-results`, `.expo` e `node_modules` com código-fonte.
