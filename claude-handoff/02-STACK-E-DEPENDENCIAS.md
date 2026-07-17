# Stack

- Monorepo npm workspaces + Turborepo; Node >=20, npm 10.8.2, TypeScript 5.6.
- `apps/mobile`: Expo 52, React Native 0.76, React Navigation, TanStack Query, Supabase JS, WatermelonDB, Expo Secure Store/Notifications/Audio/Camera.
- `apps/web`: React 18 + Vite 5, TanStack Query, Supabase JS.
- `services/api`: Fastify 5, Zod, CORS, rate-limit, Pino, Sentry, Expo Server SDK.
- `packages/shared`: tipos, constantes e schemas Zod compartilhados.
- `packages/db`: Prisma 5.22 + Postgres/Supabase.
- `supabase`: Auth, Postgres, Storage privado, Realtime e RLS.
- Testes: Playwright E2E; apenas `e2e/auth-and-demands.spec.ts` é conhecido como fluxo principal.
