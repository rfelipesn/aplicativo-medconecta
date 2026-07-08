# Supabase - MEDconecta

Fonte autoritativa do schema do banco e das políticas **RLS**.

- Região do projeto: **sa-east-1 (São Paulo)**
- Assine o **DPA** do Supabase (LGPD/dado sensível).
- Garanta **AES-256 em repouso** e **TLS** (padrão no Supabase gerenciado).

## Migrations

| Arquivo | Conteúdo |
|---|---|
| `migrations/0001_initial_schema.sql` | Enums, tabelas, índices, triggers de `updated_at` |
| `migrations/0002_rls_policies.sql` | RLS + funções `current_doctor_id()` / `current_patient_id()` |

## Como aplicar

### Opção A — SQL Editor (rápido)
Cole o conteúdo de cada migration, na ordem, no SQL Editor do projeto Supabase.

### Opção B — Supabase CLI
```bash
# Login e link ao projeto
supabase login
supabase link --project-ref SEU_PROJECT_REF

# Aplicar migrations
supabase db push
```

## Modelo de identidade

- `public.users.id` referencia `auth.users.id` (Supabase Auth).
- Login: CPF/email + senha (provisionamento presencial). Sem SMS/OTP pago.
- RLS usa `auth.uid()` para mapear o usuário ao seu `patient`/`doctor`.

## Storage (buckets privados)

Criar buckets privados com signed URLs de curta duração:
- `exams` (PDF/JPEG/PNG)
- `audios` (relatos e chat)
- `recipes` (PDF da receita anexado pelo médico)
