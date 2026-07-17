# Comandos e ambiente

## Requisitos

- Node.js >=20.
- npm 10.8.2 indicado pelo projeto.
- Supabase/Postgres configurado para fluxos reais.
- Variáveis copiadas dos arquivos `.env.example`, sem expor valores reais.

## Comandos principais

```powershell
npm install
npm run dev:api
npm run dev:web
npm run dev -w @medconecta/mobile
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run db:generate
npm run db:apply
```

API local padrão: `0.0.0.0:3333`.

## Variáveis conhecidas

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `SENTRY_DSN`, `API_PORT`, `API_HOST`, `NODE_ENV`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`.

O mobile também usa configuração Expo em `apps/mobile/src/config/env.ts` e `app.json`; confirmar nomes e comportamento de `EXPO_PUBLIC_*` no código atual. Nunca copiar valores do `.env` real para chats, logs ou documentação.

## Validação proporcional

- Mudança de tipos/contratos: typecheck em todos os workspaces.
- Mudança web: typecheck + build web + teste visual.
- Mudança mobile: typecheck + Expo web/dispositivo + fluxo manual.
- Mudança API: typecheck/build + teste do endpoint e autorização.
- Mudança clínica: ida e volta paciente–médico e verificação no banco.
- Mudança DB/RLS: migration em ambiente seguro, testes de papéis e rollback planejado.
