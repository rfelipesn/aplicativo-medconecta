# MEDconecta — handoff atual para Claude Code

Atualizado em 2026-07-17 (fim da sessão de design + funcfix + bugfixes + ciclos pós-deploy).

Estado atual: **branch `main`, todos os commits já foram pushados para o GitHub e deployados na VPS**. Sem mudanças locais pendentes.

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

## Estado atual do worktree (snapshot 2026-07-17 18:50)

- Branch: `main`
- HEAD: `e24dad1 Chore: remover alvos de deploy abandonados (railway.json, vercel.json)`
- Working tree: **limpo, sem mudanças locais não comitadas**.
- Tudo já comitado + pushado para `origin/main` + deployado na VPS.
- Backups na VPS em `/opt/medconecta/.deploy-backups/` (design-*, funcfix-*, bugfix-*).

Sempre confirme o estado real com:

```powershell
git status --short
git log --oneline -10
```

## Histórico de commits desta rodada (na ordem)

1. `004a300` — Deploy: Fluent Accent + fixes funcionais + 6 tarefas
2. `a3ac9b3` — Fix: EXPO_PUBLIC_API_URL ignorado no web bundle
3. `81e4652` — Add VPS IP 173.212.230.29 to CORS allowed origins
4. `c823f47` — **Fix: upload 405 — signedUrl era relativa, browser fazia PUT no Nginx**
5. `224a08c` — **Web: modal de receita, deep-link de notificações e card colapsável**
6. `de9799d` — **Fix: notifications.related_demand_id FK removida (campo polimórfico)**
7. `e24dad1` — **Chore: remover alvos de deploy abandonados (railway.json, vercel.json)**

## O que foi feito nesta sessão (7 ciclos)

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
| b4 | Médico via formulário "Solicitar receita" | Prop `role: 'patient'\|'doctor'`; formulário só para paciente | `apps/web/src/pages/RecipesPanel.tsx`, `Dashboard.tsx` |
| b5 | Exames não atualizavam no painel | `refetchInterval: 30s` + `refetchOnWindowFocus` | `apps/web/src/pages/ExamsPanel.tsx` |
| b6 | Minhas Demandas: tipos irrelevantes + chips feios | Removidos `general_question`/`second_opinion`; chips com `IconSquircle` | `apps/mobile/src/screens/DemandsScreen.tsx` |
| b7 | Push deep-link sempre ia pra home | Mapeamento `type → tab` (chat/receitas/notificações) | `apps/mobile/src/hooks/usePushNotifications.ts` |

### Ciclo 4 — Fix do 405 no upload (commit `c823f47`)

**Causa raiz:** O backend retornava `signedUrl` como **URL relativa** (`/object/upload/sign/<bucket>/<path>?token=<jwt>`). O Supabase Storage responde o endpoint `POST /storage/v1/object/upload/sign/...` com `{ url, token }`, onde `url` é relativo. O navegador resolvia contra a origem atual `medconecta.173-212-230-29.sslip.io`, virando `PUT https://medconecta.173-212-230-29.sslip.io/object/upload/sign/...`. O Nginx só tem proxy para `/api/` → **405 Method Not Allowed**.

**Correção:**

- `services/api/src/lib/storage.ts`: `createSignedUploadUrl` agora compõe a URL absoluta juntando `env.SUPABASE_URL + '/storage/v1' + url_relativo`.
- `apps/web/src/lib/upload.ts` **(NOVO)**: função utilitária única `uploadFileViaSignedUrl` que valida se a URL começa com `https://`, faz PUT direto no Storage, com `x-upsert: false` e mensagens de erro em PT-BR.
- 3 painéis atualizados para usar a função utilitária: `DocumentsPanel.tsx`, `ExamsPanel.tsx`, `DemandsPanel.tsx`.

**Validação:** PUT direto no Supabase com URL absoluta + Origin do browser = HTTP 200. CORS preflight OK. Deploy OK.

### Ciclo 5 — UX do painel médico (commit `224a08c`)

**R1 — Receitas pendentes (médico):**

- Antes: "Marcar como respondida" direto, sem ver nem anexar nada.
- Agora: botão **"Abrir e enviar receita"** abre modal com dados completos (medicamentos, motivo, quantidade, prazo) + campo para anexar PDF/JPG/PNG. Fluxo: upload do PDF → registra como documento `recipe` → marca receita como respondida.
- Mantido botão secundário "Marcar sem anexo" (com confirmação) para casos sem PDF.
- CSS novo em `index.css`: `.modal-overlay`, `.modal-card`, `.recipe-detail-row`.

**R2 — Notificação clicável no painel:**

- Antes: clicava na notificação e nada acontecia.
- Agora: cada item do dropdown é um botão clicável. Mapeamento `type → destino`:
  - `new_recipe_request` / `recipe_response` → rola até `#receitas-pendentes`
  - `new_demand` / `demand_response` / `appointment_confirmed` → rola até `#demandas`
  - `new_document` → seleciona paciente da demanda + rola até `#documentos`
  - `new_chat_message` → seleciona paciente + rola até `#conversa`
  - padrão → `#demandas`
- Notificação marcada como lida automaticamente.
- `AppNotification` estendido com `relatedDemandId` (já existia no backend).
- Painéis do Dashboard ganharam `id` âncora (`#demandas`, `#conversa`, `#receitas-pendentes`, `#solicitacoes-exame`, `#documentos`).

**R3 — Card "Cadastrar paciente" colapsável:**

- Default **fechado**. Clicando no header expande/recolhe com seta (▾/▴).
- CSS: `.collapsible-card`, `.collapsible-header`, `.collapsible-toggle`, `.collapsible-content`.

### Ciclo 6 — Fix FK notifications (commit `de9799d`)

**Erro do usuário:** ao responder receita no modal, Prisma disparava:
`Invalid prisma.notification.create() invocation: Foreign key constraint violated: notifications_related_demand_id_fkey`

**Causa raiz:** a coluna `notifications.related_demand_id` tinha FK direto para `demands(id)` (definida em `supabase/migrations/0001_initial_schema.sql:272`). Mas o campo era usado como referência **polimórfica**:

- `recipes.ts:90,200` → `relatedDemandId: recipe.id` (RecipeRequest, não Demand)
- `documents.ts:140` → `relatedDemandId: document.id` (Document, não Demand)
- `chat.ts:187,285` → `relatedDemandId: access.patientId` (Patient, não Demand)
- `demands.ts:135,401,585` → `relatedDemandId: demand.id` (único caso legítimo)

**Correção:**

- **Migration nova** `supabase/migrations/0005_notifications_remove_related_fk.sql`: `ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_related_demand_id_fkey`. **Aplicada manualmente no Supabase.**
- **Schema Prisma** (`packages/db/prisma/schema.prisma`): removida a relation `relatedDemand` no `Notification` e `notifications Notification[]` no `Demand` (eram type-suggestions que sugeriam FK, mas ela já não existe no banco). Adicionado comentário explicando uso polimórfico.
- Coluna UUID mantida no banco (sem rename — todo o código continua usando `relatedDemandId`).

### Ciclo 7 — Limpeza de alvos de deploy abandonados (commit `e24dad1`)

**Problema:** o usuário recebia emails "Build failed" do Railway (`marvelous-charisma` / `@medconecta/mobile`) e do Vercel (`aplicativo-medconecta-api`). Ambos eram alvos abandonados (VPS é o destino oficial desde 2026-07-17), mas os arquivos de config continuavam no repo.

**Correção:**

- Removido `railway.json` (fazia Railway tentar buildar o mobile/Expo em todo push → falhava → email).
- Removido `vercel.json` (idem).
- **Para parar os emails de verdade**, o usuário precisa desativar/deletar os projetos no painel do Railway e Vercel — sem isso, o GitHub continua webhookando.
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

O usuário pediu para **salvar o contexto agora** para abrir no Claude Desktop. Estado estável: working tree limpo, tudo commitado na `main`, tudo deployado na VPS.

Possíveis próximos passos quando retomar:

1. **Continuar bugfixes** que o usuário encontrar ao testar a UX nova (modal de receita, deep-link, card colapsável).
2. **Implementar gaps restantes** (#4 upload mobile, #6 áudio, #7 badge, #8 cron SLA — ver tabela "Gaps conhecidos" abaixo).
3. **Desativar projeto Railway/Vercel** no painel para parar os emails de "build failed".
4. **Reconciliar workflow GitHub Actions** `.github/workflows/deploy.yml` com a VPS real (divergente — usa Docker inativo). Remover o workflow é a forma mais simples.
5. **Trocar senha da VPS e configurar chave SSH** (ainda usando senha compartilhada, risco de segurança).
6. **Adicionar EAS Build** para gerar binários nativos do mobile (`@medconecta/mobile`) — Railway/Vercel não dão conta; EAS é o caminho oficial do Expo.

Não assumir que o usuário quer commit/push/deploy/migration. Ele pediu apenas para "salvar o contexto no Cursor e no Claude" — este documento é o checkpoint.

## Notas importantes para retomada

- **Nunca** fazer `git reset --hard`, `git checkout --`, `git clean` ou sobrescrever o working tree sem autorização explícita.
- **Nunca** expor senhas, tokens, `.env`, PHI.
- **Nunca** fazer commit/push/deploy/migration sem pedido explícito.
- O grafo de código (`graphify-out/`) está atualizado: 1845 nós, 2950 arestas.
- Os arquivos `.md` na raiz (`CLAUDE.md`, `PLANO_MEDCONECTA.md`, `DESIGN.md`, `CONTEXTO_ATUAL.md`) são fontes de verdade e não devem ser apagados.
- As pastas `cursor-handoff/` e `claude-handoff/` contêm handoffs anteriores; consultar se necessário.

## Resultado esperado da próxima sessão

Continuar corrigindo bugs reportados pelo usuário ou implementar os gaps restantes, sempre preservando o trabalho já deployado. Antes de editar, confirmar o estado do Git e da VPS.
