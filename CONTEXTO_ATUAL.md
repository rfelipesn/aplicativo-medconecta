# MEDconecta — handoff atual para Claude Code

Atualizado em 2026-07-17 (fim da sessão de design + funcfix + bugfixes). Estado: trabalho em andamento na branch `main`, **não comitado**, **já deployado na VPS**.

## Objetivo do produto

O MEDconecta possui dois lados que precisam operar como um único sistema:

- Paciente: aplicativo Expo/React Native para login, onboarding, diário de cefaleia, diário de convulsão, sintomas, demandas, receitas, documentos/exames, chat e notificações.
- Médico: painel React/Vite para acompanhar pacientes, receber tudo que eles registram ou solicitam, responder demandas, avaliar eventos clínicos, gerir receitas/documentos e se comunicar.

O objetivo central é provar a ligação paciente → Supabase/API → médico → resposta ao paciente.

## Arquitetura confirmada

- Monorepo TypeScript com npm workspaces e Turborepo.
- `apps/mobile`: Expo 52, React Native 0.76, React Navigation, WatermelonDB e Supabase. É o lado do paciente e também exporta para web em `/app`.
- `apps/web`: React 18 + Vite. É o painel médico, servido em `/`.
- `services/api`: Fastify 5. Regras de negócio, autenticação, demandas, chat, documentos e notificações. Roda em PM2 na porta 3333.
- `packages/shared`: contratos e schemas compartilhados (Zod).
- `packages/db`: Prisma.
- `supabase`: migrations, Auth, Postgres, Storage, Realtime e políticas RLS.
- VPS oficial: `173.212.230.29`. Instalação em `/opt/medconecta`, usando Nginx + PM2.
- URLs de produção (verificadas 200):
  - Médico: https://medconecta.173-212-230-29.sslip.io
  - Paciente: https://medconecta.173-212-230-29.sslip.io/app/
  - API health: https://medconecta.173-212-230-29.sslip.io/api/health

## Direção visual aprovada e implementada

Fluent Accent — aplicado em **todas as telas mobile e painel web**, já deployado.

- Tokens em `apps/mobile/src/theme/tokens.ts` (azul-petróleo `#85B7BF`/`#4E8E99`, superfícies claras, gradientes).
- CSS do painel em `apps/web/src/index.css` com variáveis Fluent.
- Componente `apps/mobile/src/components/FluentScreen.tsx` (header gradiente, card, empty, loading, primary button).
- `apps/mobile/src/components/FluentIcon.tsx` (ícones vetoriais substituindo emojis).
- Documento `DESIGN.md` com o design system completo.
- Nginx configurado com `Cache-Control: no-cache` no HTML para forçar refresh de assets com hash.

## Estado atual do worktree (snapshot 2026-07-17 16:23)

- Branch: `main`
- HEAD: `a3ac9b3 Fix: EXPO_PUBLIC_API_URL ignorado no web bundle`
- **57 arquivos modificados, ~2140 inserções, ~953 remoções** (rastreados)
- Arquivos não rastreados: `.vscode/`, `CLAUDE.md`, `CONTEXTO_ATUAL.md`, `DESIGN.md`, `PLANO_MEDCONECTA.md`, `apps/mobile/src/components/` (FluentIcon, FluentScreen), `apps/mobile/src/watermelon/adapter.d.ts`, `claude-handoff/`, `cursor-handoff/`, `novo 46.txt`, templates docker.
- **Nada foi comitado.** Tudo está no working tree local + deployado na VPS.
- Backups na VPS em `/opt/medconecta/.deploy-backups/` (design-*, funcfix-*, bugfix-*).

Sempre confirme o estado real com:

```powershell
git status --short
git diff --stat
```

## O que foi feito nesta sessão (3 ciclos)

### Ciclo 1 — Design Fluent Accent (deployado)

- Tokens Fluent em `tokens.ts` + `DESIGN.md`.
- `FluentScreen.tsx` e `FluentIcon.tsx` criados.
- Todas as screens mobile + features headache/seizure com Fluent Accent.
- Emojis removidos, substituídos por `FluentIcon`.
- Painel web (`index.css` + todos os panels) com identidade Fluent.
- Typecheck limpo. Build web + mobile export OK.

### Ciclo 2 — Correções funcionais (deployadas)

| # | Correção | Arquivo |
|---|----------|---------|
| 1 | `responseNotes` persistido em demands (append em `description` com marcador) + derivado nos 4 endpoints GET/PATCH | `services/api/src/routes/demands.ts` |
| 2 | Chat envia notificação in-app + push para a outra parte (REST e sync WatermelonDB) | `services/api/src/routes/chat.ts` |
| 3 | Upload de documento cria notificação in-app + push | `services/api/src/routes/documents.ts` |
| 5 | Removida mensagem de boas-vindas mockada do chat ("Dr. Helton") | `apps/mobile/src/screens/ChatScreen.tsx` |

### Ciclo 3 — Bugfixes do usuário (deployados)

| # | Bug | Correção | Arquivo |
|---|-----|----------|---------|
| b1 | Upload doc: erro `expiresIn` | `createSignedUploadUrl` envia `{ expiresIn: 3600 }` | `services/api/src/lib/storage.ts` |
| b2 | HealthEvents: campo "Quando" horrível | Botões Hoje/Ontem/Escolher data | `apps/web/src/pages/HealthEventPanel.tsx` |
| b3 | Responder demanda de receita sem anexo | Campo de anexo PDF/PNG quando `recipe_renewal` | `apps/web/src/pages/DemandsPanel.tsx` |
| b4 | Médico via formulário "Solicitar receita" | Prop `role: 'patient'|'doctor'`; formulário só para paciente | `apps/web/src/pages/RecipesPanel.tsx`, `Dashboard.tsx` |
| b5 | Exames não atualizavam no painel | `refetchInterval: 30s` + `refetchOnWindowFocus` | `apps/web/src/pages/ExamsPanel.tsx` |
| b6 | Minhas Demandas: tipos irrelevantes + chips feios | Removidos `general_question`/`second_opinion`; chips com `IconSquircle` | `apps/mobile/src/screens/DemandsScreen.tsx` |
| b7 | Push deep-link sempre ia pra home | Mapeamento `type → tab` (chat/receitas/notificações) | `apps/mobile/src/hooks/usePushNotifications.ts` |

## Estado funcional conhecido (pós-correções)

### Fluxos completos (paciente ↔ médico ↔ resposta)

- ✅ **Demandas** — criação, push ao médico, resposta com `responseNotes` persistido, push ao paciente, polling 15s.
- ✅ **Receitas** — solicitação (paciente), SLA 72h, resposta (médico), push ida/volta, polling 15s.
- ✅ **Documentos** — upload web (sign-upload → Storage → register), notificação push, download ambos lados.
- ✅ **Chat** — texto, polling 4-8s, notificação + push ambas direções, marcação de lidas.
- ✅ **Diários cefaleia/crise** — sync WatermelonDB completo, visualização no painel médico.
- ✅ **Login** — paciente (CPF + nascimento), médico (email + senha).
- ✅ **Notificações in-app** — com push Expo, polling 30s.
- ✅ **Push deep-link** — clicar leva à tab relevante.

### Gaps conhecidos (não corrigidos, para próximo ciclo)

| # | Gap | Severidade |
|---|-----|-----------|
| 4 | Mobile não faz upload de documentos (só download) | Médio |
| 6 | Mensagens de áudio não reproduzem (só `"[Mensagem de áudio]"`) | Médio |
| 7 | Sem badge de não-lidas de chat na tab bar / dashboard | Médio |
| 8 | Sem cron de SLA de receitas ativo (`/recipes/sla/check` existe mas não é agendado) | Médio |
| 9 | Sync duplicado de chat no mobile (8s no ChatScreen + 30s no Watermelon) | Baixo |
| 10 | Sem Supabase Realtime (tudo é polling) | Baixo |

### Estado do banco (VPS, 2026-07-17)

- 19 usuários (8 médicos, 11 pacientes).
- API saudável, DB up, latência ~430ms.
- `/stats`: `recipeRequests: 0, examUploads: 0` (sem receitas/exames na base ainda, mas rotas funcionam).

## Estado de infraestrutura e segurança

- HTTPS funcionando com Let's Encrypt no hostname `medconecta.173-212-230-29.sslip.io`.
- Nginx serve:
  - `/` → `/opt/medconecta/apps/web/dist` (painel médico)
  - `/app/` → `/opt/medconecta/apps/mobile/dist` (paciente web export)
  - `/api/` → proxy para `127.0.0.1:3333` (Fastify/PM2)
- CORS configurado para o hostname sslip.io + Netlify origins.
- PM2: `medconecta-api` (fork, Node, cwd `/opt/medconecta`).
- `.env` da API em `/opt/medconecta/services/api/.env` (não expor).
- **Atenção:** a senha administrativa da VPS foi usada durante a sessão para deploy via SSH. Deve ser trocada e substituída por acesso via chave SSH.
- Workflow GitHub Actions (`.github/workflows/deploy.yml`) ainda aponta para `/app` + Docker — **divergente** da VPS real. Não confiar nele para deploy.

## Como fazer deploy daqui em diante

Não há CLI de deploy versionado. O deploy é manual via SSH:

1. Upload dos arquivos alterados via SFTP (paramiko) para `/opt/medconecta`.
2. Rebuild na VPS:
   ```bash
   cd /opt/medconecta
   npm run build -w @medconecta/api
   npm run build -w @medconecta/web
   cd apps/mobile && npx expo export --platform web --output-dir dist
   pm2 restart medconecta-api --update-env
   systemctl reload nginx
   ```
3. Health check: `curl -sk https://medconecta.173-212-230-29.sslip.io/api/health`

Scripts de deploy temporários usados nesta sessão: `C:\Users\xr\AppData\Local\Temp\vps_deploy_*.py` (usam paramiko, senha via env var `MEDCONECTA_VPS_PASS`).

## Comandos úteis

Na raiz do repositório:

```powershell
npm install
npm run typecheck                  # typecheck de todos os workspaces
npm run typecheck -w @medconecta/api
npm run typecheck -w @medconecta/mobile
npm run typecheck -w @medconecta/web
npm run build -w @medconecta/web
npm run dev:api
npm run dev:web
npm run dev -w @medconecta/mobile
```

O workspace mobile não tem script `build` padrão — use `npx expo export --platform web --output-dir dist`.

## Próxima ação recomendada

O usuário está testando os bugfixes do ciclo 3. Possíveis próximos passos dependem do retorno dele:

1. **Corrigir bugs adicionais** que o usuário encontrar ao testar o ciclo 3.
2. **Implementar gaps restantes** (#4 upload mobile, #6 áudio, #7 badge, #8 cron SLA).
3. **Commitar o trabalho** quando o usuário confirmar que está estável (ele ainda não pediu commit).
4. **Reconciliar workflow GitHub** com a VPS real (item 3 do roadmap em `PLANO_MEDCONECTA.md`).

Não assumir que o usuário quer commit/push. Ele pediu apenas para "salvar o contexto no Cursor" — este documento é o checkpoint.

## Notas importantes para retomada

- **Nunca** fazer `git reset --hard`, `git checkout --`, `git clean` ou sobrescrever o working tree sem autorização explícita.
- **Nunca** expor senhas, tokens, `.env`, PHI.
- **Nunca** fazer commit/push/deploy/migration sem pedido explícito.
- O grafo de código (`graphify-out/`) está atualizado: 1845 nós, 2950 arestas.
- Os arquivos `.md` na raiz (`CLAUDE.md`, `PLANO_MEDCONECTA.md`, `DESIGN.md`, `CONTEXTO_ATUAL.md`) são fontes de verdade e não devem ser apagados.
- As pastas `cursor-handoff/` e `claude-handoff/` contêm handoffs anteriores; consultar se necessário.

## Resultado esperado da próxima sessão

Continuar corrigindo bugs reportados pelo usuário ou implementar os gaps restantes, sempre preservando o trabalho já deployado. Antes de editar, confirmar o estado do Git e da VPS.
