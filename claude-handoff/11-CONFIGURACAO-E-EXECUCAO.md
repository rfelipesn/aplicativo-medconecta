# Configuração e execução

Pré-requisito: Node >=20, npm 10.8.2, Supabase/Postgres configurados e variáveis dos três `.env.example` preenchidas sem commit do `.env` real.

Comandos raiz: `npm install`, `npm run dev:api`, `npm run dev:web`, `npm run dev -w @medconecta/mobile`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`, `npm run db:generate`, `npm run db:apply`, `npm run docker:up`.

API padrão: `0.0.0.0:3333`. Deploy possui caminhos Netlify/Vercel/Railway/Docker e VPS; consulte `README.md`, `VERSOES_RODANDO.md`, `docker-compose.yml`, `railway.json`, `vercel.json`, `apps/*/netlify.toml` e workflows antes de publicar.
