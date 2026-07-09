import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Railway (e a maioria dos PaaS) injeta a porta em `PORT`. Usamos ela como
  // default para `API_PORT` para que o serviço suba na porta esperada sem
  // configuração extra; localmente cai para 3333.
  API_PORT: z.coerce.number().default(Number(process.env.PORT) || 3333),
  API_HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
