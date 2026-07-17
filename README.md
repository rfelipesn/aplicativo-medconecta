# MEDconecta

Aplicativo médico mobile (iOS/Android, Expo) + painel web para o médico.
Comunicação paciente-médico, diários clínicos (cefaleia/epilepsia), registro de sintomas
e upload de documentos. Inicia com 1 médico (Dr. Helton Bruno) e escala para múltiplos médicos.

> Documentação oficial e fonte única de verdade do projeto:
> `PLANO_MEDCONECTA.md` (o plano anterior, do Cursor, foi perdido por nunca ter sido
> versionado neste repositório)

## Pilares de arquitetura

- **BaaS-first:** Supabase (Postgres + Auth + Storage + Realtime), região `sa-east-1`, com RLS.
- **Monorepo:** Turborepo (npm workspaces), TypeScript ponta a ponta.
- **Offline-first:** WatermelonDB no mobile para registro de crises/sintomas.
- **OTA:** EAS Update (correções sem esperar revisão da loja).
- **IA pragmática:** triagem (gpt-4o-mini) + transcrição (Whisper) na Fase 2, mesma conta OpenAI.
- **Conformidade:** LGPD (dado sensível) + CFM (retenção 20 anos), TLS + AES-256, escopo eletivo.

## Estrutura do monorepo

```
medconecta/
├── apps/
│   ├── mobile/        # Expo (paciente + médico mobile)
│   └── web/           # Vite + React (painel do médico)
├── services/
│   └── api/           # Fastify (IA, transcrição, SLA da receita)
├── packages/
│   ├── shared/        # Schemas Zod, tipos, constantes (contrato único)
│   └── db/            # Prisma schema (acesso tipado pela API)
└── supabase/          # Migrations SQL + políticas RLS (fonte autoritativa do schema)
```

## Pré-requisitos

- Node.js >= 20
- npm >= 10
- Conta Supabase (projeto em `sa-east-1`)
- (Fase 2) Conta OpenAI

## Setup

```bash
# 1. Instalar dependências de todo o monorepo
npm install

# 2. Configurar ambiente
cp .env.example .env   # preencha as chaves do Supabase

# 3. Aplicar o schema no banco (Supabase)
#    Use o SQL em supabase/migrations no SQL Editor do Supabase,
#    ou a Supabase CLI: `supabase db push`

# 4. Rodar tudo em desenvolvimento
npm run dev
```

## Scripts úteis (raiz)

| Comando | Descrição |
|---|---|
| `npm run dev` | Sobe apps/services em modo dev (Turborepo) |
| `npm run typecheck` | Checagem de tipos em todos os pacotes |
| `npm run lint` | Lint em todos os pacotes |
| `npm run db:generate` | Gera o client Prisma |
| `npm run format` | Formata com Prettier |
| `npm run docker:build` | Build das imagens Docker |
| `npm run docker:up` | Sobe API + Web (usa Supabase em nuvem) |
| `npm run docker:down` | Para os containers |
| `npm run docker:logs` | Tail de logs de todos os serviços |
| `npm run docker:dev` | Sobe API + Web + Postgres local (profile `with-db`) |

## Docker (dev local)

### Apenas API + Web (usa Supabase em nuvem)

```bash
docker compose up -d
# API: http://localhost:3333
# Web: http://localhost:5173
```

### Com Postgres local (sem Supabase)

```bash
docker compose --profile with-db up -d
# Sobe também um Postgres 15 com as migrations em supabase/migrations
# carregadas automaticamente como entrypoint init.
```

> O `services/api/.env` é montado em runtime (não vai pra imagem). Copie `.env.example` para lá
> ou defina as variáveis no `.env` da raiz (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
> `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `VITE_API_URL`, `VITE_SUPABASE_URL`,
> `VITE_SUPABASE_ANON_KEY`) antes de subir os containers.

## CI/CD

Pipeline roda automaticamente em:

- `main` → testes + build de artefatos
- `develop` → testes
- PRs contra `main` → apenas testes
- Deploy manual (ou em push para `main`) via workflow `Deploy` usando SSH (secret `DEPLOY_SSH_KEY`)

Os workflows vivem em `.github/workflows/ci.yml` e `.github/workflows/deploy.yml`.
Os Dockerfiles (multi-stage) ficam em `services/api/Dockerfile` e `apps/web/Dockerfile`,
com `nginx.conf` servindo o build do Vite em produção.

## Status

**Versão 1.0 — pronta para TestFlight e Play Console (Internal Testing).**

| Feature | API | Web | Mobile |
|---|---|---|---|
| Auth (médico / paciente CPF+data nasc / assistente) | ✅ | ✅ | ✅ |
| Chat (texto + áudio com transcrição Groq) | ✅ | ✅ | ✅ |
| Diário de Cefaleia (11 passos, offline) | ✅ | ✅ | ✅ |
| Diário de Convulsão (wizard, offline) | ✅ | ✅ | ✅ |
| HealthEventLog (sintomas gerais, filtros) | ✅ | ✅ | ✅ |
| Demandas (CRUD + triagem IA Groq) | ✅ | ✅ | ✅ |
| Receitas (solicitação + resposta + SLA) | ✅ | ✅ | ✅ |
| Exames (upload) | ✅ | ✅ | — |
| Documentos (download assinado) | ✅ | ✅ | ✅ |
| Notificações in-app | ✅ | ✅ | ✅ |
| **Push Notifications (Expo)** | ✅ | — | ✅ |
| **Biometria (Face ID / Digital)** | — | — | ✅ |
| **Assistentes (permissões granulares + audit log)** | ✅ | ✅ | — |
| **Testes E2E (Playwright)** | ✅ | — | — |
| **CI/CD + Docker Compose** | ✅ | ✅ | — |

## Features em destaque

### 🤖 Triagem de demandas + transcrição de áudio (Groq, **gratuito**)
A triagem automática de demandas (`triageLayer2`) e a transcrição de áudios
(`whisper-large-v3`) rodam na API Groq, sem custo até os limites free-tier.
Configure `GROQ_API_KEY` em `services/api/.env`.

### 📱 Push Notifications (Expo)
- Mobile registra o token no backend via `POST /push-tokens` (Expo SDK).
- API envia push automaticamente em: **nova demanda** (para o médico) e **resposta do médico** (para o paciente).
- Tokens `DeviceNotRegistered` são limpos automaticamente.
- Permissões iOS configuradas em `apps/mobile/app.json` (`NSFaceIDUsageDescription` para biometria, etc).

### 🔐 Biometria
- `apps/mobile/src/lib/biometrics.ts` — abstração sobre `expo-local-authentication`.
- Login biométrico após o primeiro login com CPF + data de nascimento.
- Credenciais salvas em `expo-secure-store` (Keychain iOS / Keystore Android).
- Fallback automático para senha (CPF + data) se o usuário recusar.

### 👥 Assistentes (DoctorAssistant)
Médicos podem vincular assistentes com permissões granulares:

| Permissão | Descrição |
|---|---|
| `can_view` | Ler prontuário, chat, diário e exames |
| `can_respond` | Responder demandas e enviar mensagens no chat |
| `can_approve_recipes` | Marcar receitas como respondidas |

Todas as ações dos assistentes são registradas em `AuditLog` com
`resourceType: 'doctor_assistant'` e ações específicas (`assistant_respond_demand`, etc.).

### 📝 HealthEventLog (sintomas gerais)
- API: `GET/POST /patients/:id/health-events` e `GET .../stats?days=N`.
- Mobile: tela com filtros (por tipo + últimos 7/30/90 dias).
- Web: painel no Dashboard com stats agregadas.

### 🧪 Testes E2E (Playwright)
Cobertura do fluxo principal:
- Médico: cadastro → login → cadastro de paciente → vê credenciais.
- Paciente: login via API (CPF+data) → cria demanda → médico responde.
- UI: `/auth/login` → `/dashboard` → `DemandsPanel` → resposta.

Rode com:
```bash
npm run test:e2e
npm run test:e2e:ui   # interface visual
```

### 🐳 Docker (dev local)
```bash
# Apenas API + Web (Supabase em nuvem)
docker compose up -d

# Com Postgres local (profile opcional)
docker compose --profile with-db up -d
```

A imagem da API é multi-stage (Node 20 alpine), o Web usa nginx com cache de 30d nos assets.
Variáveis são injetadas em runtime a partir do `.env` (nunca comitadas).

### 🚀 CI/CD
- `.github/workflows/ci.yml`: roda typecheck + lint + build + Playwright E2E em todo PR.
- `.github/workflows/deploy.yml`: deploy SSH para o servidor configurado em produção (action `appleboy/ssh-action`).

Configure os secrets no GitHub:
`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`GROQ_API_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`.

## Comandos rápidos

```bash
# Dev
npm run dev                  # sobe tudo (api + web + mobile)
npm run dev:api              # só a API
npm run dev:web              # só o painel médico

# Validação
npm run typecheck            # checagem de tipos em todos os pacotes
npm run lint                 # mesmo que typecheck (TS estrito)
npm run build                # build de produção (api + web + shared)

# DB
npm run db:generate          # regenera o client Prisma
npm run db:studio            # abre o Prisma Studio

# E2E
npm run test:e2e             # roda os testes Playwright
npm run test:e2e:ui          # modo visual

# Docker
npm run docker:build
npm run docker:up
npm run docker:down
npm run docker:logs
npm run docker:dev           # com Postgres local
```

## Testando localmente

1. **Crie o projeto no Supabase** (sa-east-1) e rode as migrations de `supabase/migrations/` no SQL Editor.
2. **Copie `.env.example` para `.env`** e preencha as chaves (Supabase + Groq).
3. **Suba a API** (`npm run dev:api`) e o **Web** (`npm run dev:web`).
4. Acesse `http://localhost:5173`, cadastre o primeiro médico, e em seguida cadastre um paciente.
5. **Mobile**: `cd apps/mobile && npm run dev` (Expo Go) ou `npm run ios/android` (build nativo).
6. **Testes E2E**: `npm run test:e2e` (sobe API + Web automaticamente via `playwright.config.ts`).
7. **Publicação nas lojas**:
   - iOS: `eas build --platform ios` + `eas submit --platform ios`.
   - Android: `eas build --platform android` + `eas submit --platform android`.
   - Certifique-se de preencher `extra.eas.projectId` em `apps/mobile/app.json`.
