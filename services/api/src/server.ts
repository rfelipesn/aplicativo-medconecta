import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './env.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerRecipeRoutes } from './routes/recipes.js';
import { registerAiRoutes } from './routes/ai.js';
import { registerTranscriptionRoutes } from './routes/transcription.js';
import { registerNotificationRoutes } from './routes/notifications.js';

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

  await registerHealthRoutes(app);
  await registerRecipeRoutes(app);
  await registerAiRoutes(app);
  await registerTranscriptionRoutes(app);
  await registerNotificationRoutes(app);

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
