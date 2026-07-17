# Autenticação e segurança

Auth usa Supabase Auth; login documentado como CPF/email + senha, com provisionamento presencial. API aplica middleware em `services/api/src/middleware/auth.ts` e autorização de assistentes em `assistantAccess.ts`; RLS limita acesso por `auth.uid()` e vínculo patient/doctor. Tokens/sessão são tratados nos hooks `apps/*/src/hooks/useSession.ts`; mobile também usa Secure Store e biometria.

Não copie `.env` real, tokens, chaves ou senhas. Variáveis e riscos estão em `.env.example`, `services/api/.env.example`, `apps/web/.env.example` e `CONTEXTO_ATUAL.md`. Validar CORS, rate limit, signed URLs, logs sem PHI, auditoria e rotação de credenciais antes de produção.
