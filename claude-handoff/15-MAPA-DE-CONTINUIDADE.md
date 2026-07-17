# Mapa de continuidade

Leia primeiro: `CLAUDE.md`, `CONTEXTO_ATUAL.md`, `PLANO_MEDCONECTA.md`, `README.md`, este pacote, `services/api/src/server.ts`, `apps/mobile/src/App.tsx`, `apps/web/src/App.tsx`, schemas shared e migrations.

Faça primeiro o inventário ponta a ponta. Depois corrija conexões clínicas desconectadas. Em paralelo, só tarefas sem escrita sobre os mesmos módulos. Alterar com cuidado: auth, RLS, migrations, adapters Watermelon, API clients, navegação e mudanças locais do mobile.

Valide com `npm run typecheck`, `npm run lint`, `npm run build` e E2E/manual conforme o fluxo. Peça confirmação antes de migration, deploy, rotação de credenciais ou limpeza de arquivos.
