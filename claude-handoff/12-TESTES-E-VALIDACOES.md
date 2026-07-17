# Testes

Executado nesta análise em 17/07/2026: `npm run typecheck` — 7 tarefas, todas bem-sucedidas; `npm run lint` — 5 tarefas, todas bem-sucedidas; `npm run build` — API, web, shared e db bem-sucedidos, com warning Vite de chunk >500 kB. Não foi executado E2E nesta análise.

E2E conhecido: `e2e/auth-and-demands.spec.ts`, configuração em `playwright.config.ts`. Checklist manual: login/onboarding, demandas nos dois lados, chat texto/áudio, registros de diários e estatísticas, documentos/exames, receitas, push, biometria, offline/sync, RLS e viewport mobile/web.
