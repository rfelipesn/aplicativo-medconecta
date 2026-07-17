# APIs e integrações

Rotas Fastify estão em `services/api/src/routes`: auth, health, me, patients, demands, chat, audio, transcription, ai, assistants, headacheDiary, seizureDiary, healthEventLog, documents, exams, recipes, notifications e pushTokens. O grafo indexado encontrou 91 rotas e 46 relações HTTP.

Os clientes estão em `apps/mobile/src/lib/api.ts`, `apps/mobile/src/features/*/api.ts` e `apps/web/src/lib/api.ts`. Integrações: Supabase Auth/Postgres/Storage, Prisma, Groq/OpenAI para IA/transcrição, Sentry e Expo Push. Confirme payloads diretamente nos schemas compartilhados e handlers; não inferir contrato apenas pelo nome da rota.
