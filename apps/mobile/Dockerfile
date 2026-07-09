# ---- Build stage (Expo/Metro export web) ----
FROM node:20 AS build
WORKDIR /app
ENV EXPO_NO_TELEMETRY=1
ENV CI=1

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/mobile ./apps/mobile

RUN npm install --include=dev --no-audit

# Compila packages/shared antes do expo export (Metro precisa de dist/index.js)
RUN npm run build -w @medconecta/shared

# Exporta o app para web estático. URL da API e chaves do Supabase estão em
# apps/mobile/app.json (extra.apiUrl / supabaseUrl / supabaseAnonKey).
RUN cd apps/mobile && npx expo export --platform web --output-dir dist

# ---- Production stage (nginx, escuta em $PORT via template) ----
FROM nginx:alpine
ENV PORT=8080
ENV NGINX_ENVSUBST_FILTER=PORT
COPY --from=build /app/apps/mobile/dist /usr/share/nginx/html
COPY apps/mobile/default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 8080
# Sem CMD/startCommand custom: usa o entrypoint oficial que roda o envsubst
# (substitui ${PORT} no template) e sobe o nginx.
