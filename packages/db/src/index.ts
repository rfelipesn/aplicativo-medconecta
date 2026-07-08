/**
 * @medconecta/db
 * Client Prisma singleton para a API.
 *
 * O client é gerado por `prisma generate` (após `npm install`).
 * Até lá, o import de '@prisma/client' não existe — por isso o require dinâmico.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';
