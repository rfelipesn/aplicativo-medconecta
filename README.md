# MEDconecta

Aplicativo médico mobile (iOS/Android, Expo) + painel web para o médico.
Comunicação paciente-médico, diários clínicos (cefaleia/epilepsia), registro de sintomas
e upload de documentos. Inicia com 1 médico (Dr. Helton Bruno) e escala para múltiplos médicos.

> Documentação oficial e fonte única de verdade do projeto:
> `.cursor/plans/medconecta_-_arquitetura_completa_ece95dfa.plan.md`

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

## Status

Fundação inicial (Fase 0). Próximo passo: walking skeleton (provisionamento presencial →
login com senha temporária → senha/PIN → biometria → home, com WatermelonDB + RLS).
