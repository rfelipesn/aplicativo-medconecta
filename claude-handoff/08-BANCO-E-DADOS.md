# Banco e dados

Fonte primária: `supabase/migrations/0001_initial_schema.sql`, `0002_rls_policies.sql`, `0003_onboarding_state.sql`, `0003_push_tokens.sql`; modelo Prisma em `packages/db/prisma/schema.prisma`.

Domínios confirmados: users/auth, pacientes/médicos, demandas, chat, diários de cefaleia/convulsão, eventos de saúde, receitas, documentos, exames, notificações e push tokens. A identidade `public.users.id` referencia `auth.users.id`; RLS usa `auth.uid()` e funções de resolução de paciente/médico. Storage privado: `exams`, `audios`, `recipes`, com signed URLs.

Para schema completo, a próxima IA deve ler as migrations linha a linha; este resumo não substitui os SQLs. Aplicação documentada em `supabase/README.md` e `packages/db/scripts/apply-migrations.mjs`. Nunca executar migration de produção sem backup/validação.
