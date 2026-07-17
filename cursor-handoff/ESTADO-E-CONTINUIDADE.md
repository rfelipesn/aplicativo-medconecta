# Estado atual e continuidade

## Git observado

- Branch: `main`.
- HEAD observado: `a3ac9b3 Fix: EXPO_PUBLIC_API_URL ignorado no web bundle`.
- Há dezenas de arquivos rastreados modificados e arquivos não rastreados.
- O diff rastreado observado antes deste pacote tinha 37 arquivos, 1.351 inserções e 740 remoções.
- Mudanças abrangem quase todas as telas mobile, tokens e componentes visuais, navegação, WatermelonDB, CSS web, auth da API, dependências e deploy.
- `CLAUDE.md`, `CONTEXTO_ATUAL.md`, `PLANO_MEDCONECTA.md`, `claude-handoff/` e este pacote podem aparecer como não rastreados; são contexto/trabalho atual e não devem ser removidos.

Sempre confirme o estado novamente, pois o worktree pode ter evoluído.

## Validações já executadas

- `npm run typecheck`: aprovado em todos os workspaces.
- `npm run lint`: aprovado; atualmente equivale a TypeScript `--noEmit` nos pacotes.
- `npm run build`: API, web, shared e db aprovados.
- Warning: bundle web minificado acima de 500 kB.
- E2E não foi executado na criação do handoff; cobertura automatizada conhecida é limitada.

## Funcionalidades presentes no código

Autenticação/onboarding, sessão/PIN/biometria, home, demandas, chat texto/áudio, transcrição/IA, cefaleia, convulsão, eventos de saúde, receitas, documentos, exames, notificações/push, assistentes, painel médico e persistência offline.

Presença de código não prova integração completa. Cada fluxo deve ser verificado desde a interface até a persistência e retorno ao outro usuário.

## Prioridades

1. Mapear todos os fluxos paciente ↔ médico e classificar completo/parcial/desconectado/somente visual.
2. Corrigir primeiro conexões críticas de demandas, crises/sintomas, chat, documentos/exames e receitas.
3. Validar autenticação, RLS, signed URLs, isolamento de pacientes e proteção de dados.
4. Adicionar E2E para fluxos clínicos centrais.
5. Consolidar o design Fluent Accent e validar em dispositivo/viewport.
6. Reconciliar VPS Nginx+PM2 com Docker/workflows antes de deploy.

## Critérios para qualquer tarefa

- Consultar o grafo conforme `.cursor/rules/graphify.mdc`.
- Identificar arquivos e impactos antes da edição.
- Trabalhar em escopo pequeno e preservar mudanças existentes.
- Validar com typecheck/lint/build e testes pertinentes.
- Atualizar o grafo após mudanças de código, conforme regra do Cursor.
- Informar arquivos alterados, testes, riscos e próximos passos.
