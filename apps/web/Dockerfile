# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Contexto = raiz do repo (monorepo). Copia tudo (o .dockerignore exclui
# node_modules/dist/.env), instala o workspace e compila shared + web.
COPY . .
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
