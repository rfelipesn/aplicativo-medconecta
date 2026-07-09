// MEDconecta API — servidor Fastify (deploy Railway via railway.json/nixpacks).
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './env.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerMeRoutes } from './routes/me.js';
import { registerPatientRoutes } from './routes/patients.js';
import { registerChatRoutes } from './routes/chat.js';
import { registerExamRoutes } from './routes/exams.js';
import { registerDocumentRoutes } from './routes/documents.js';
import { registerRecipeRoutes } from './routes/recipes.js';
import { registerAiRoutes } from './routes/ai.js';
import { registerTranscriptionRoutes } from './routes/transcription.js';
import { registerNotificationRoutes } from './routes/notifications.js';
import { registerHeadacheDiaryRoutes } from './routes/headacheDiary.js';
import { registerAudioRoutes } from './routes/audio.js';
import { registerDemandRoutes } from './routes/demands.js';
import { registerPushTokenRoutes } from './routes/pushTokens.js';
import { registerAuditHook } from './plugins/auditHook.js';
import { registerSeizureDiaryRoutes } from './routes/seizureDiary.js';
import { registerHealthEventRoutes } from './routes/healthEventLog.js';
import { registerAssistantRoutes } from './routes/assistants.js';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'debug' : 'info',
      // Em produção, NÃO logar PHI. Use redact para campos sensíveis.
      redact: ['req.headers.authorization', '*.cpf', '*.transcriptionText'],
    },
  });

  await app.register(cors, {
    origin: env.NODE_ENV === 'development' ? true : [],
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  registerAuditHook(app);

  await registerHealthRoutes(app);
  await registerAuthRoutes(app);
  await registerMeRoutes(app);
  await registerPatientRoutes(app);
  await registerChatRoutes(app);
  await registerExamRoutes(app);
  await registerDocumentRoutes(app);
  await registerRecipeRoutes(app);
  await registerAiRoutes(app);
  await registerTranscriptionRoutes(app);
  await registerNotificationRoutes(app);
  await registerHeadacheDiaryRoutes(app);
  await registerSeizureDiaryRoutes(app);
  await registerHealthEventRoutes(app);
  await registerAudioRoutes(app);
  await registerDemandRoutes(app);
  await registerPushTokenRoutes(app);
  await registerAssistantRoutes(app);

  return app;
}

async function main() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    app.log.info(`MEDconecta API ouvindo em http://${env.API_HOST}:${env.API_PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
