# ---- Build stage (Debian p/ evitar problemas de binários nativos no Alpine) ----
FROM node:20 AS build
WORKDIR /app

# Copia só o necessário para o web: manifestos, o pacote shared e o app web.
# Assim o npm NÃO instala apps/mobile (deps nativas) nem services/api.
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN npm install --include=dev --no-audit

# Vite injeta as VITE_* no bundle em BUILD TIME — vêm como build args do Railway.
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build -w @medconecta/shared && npm run build -w @medconecta/web

# ---- Production stage (nginx estático) ----
FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY --from=build /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
