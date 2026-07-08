# @medconecta/db

Acesso tipado (Prisma) ao Postgres do Supabase para a API Fastify.

## Fonte da verdade do schema

A **fonte autoritativa** do schema e das políticas **RLS** é o SQL em
[`supabase/migrations`](../../supabase/migrations). O Prisma aqui serve para dar
tipagem ao backend e gerar o client.

## Fluxo recomendado

```bash
# 1. Aplicar as migrations no Supabase (SQL Editor ou Supabase CLI)
#    -> cria tabelas, enums, índices e RLS

# 2. Sincronizar o schema Prisma com o banco real
npm run db:pull -w @medconecta/db

# 3. Gerar o client
npm run db:generate -w @medconecta/db
```

> O `schema.prisma` versionado é um espelho inicial do modelo. Após o primeiro
> `db pull`, ele reflete exatamente o banco (incluindo o que o Supabase adiciona).

## Variáveis

- `DATABASE_URL`: string de conexão direta do Postgres do Supabase.
