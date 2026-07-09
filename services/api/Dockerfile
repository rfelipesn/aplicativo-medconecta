# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Copia manifestos e config de TS primeiro (melhor cache de layers)
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages ./packages
COPY services/api ./services/api

# Instala TODAS as deps (incl. dev: typescript, tsx, prisma) para poder compilar
RUN npm ci --include=dev --no-audit

# Compila na ordem de dependência: shared -> db -> api
RUN npm run build -w @medconecta/shared \
  && npm run build -w @medconecta/db \
  && npm run build -w @medconecta/api

# ---- Production stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# node_modules já contém o Prisma Client gerado e os symlinks de workspace
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages ./packages
COPY --from=build /app/services/api/dist ./services/api/dist
COPY --from=build /app/services/api/package.json ./services/api/package.json

WORKDIR /app/services/api
# Railway injeta PORT; env.ts usa PORT como default de API_PORT
CMD ["node", "dist/server.js"]
