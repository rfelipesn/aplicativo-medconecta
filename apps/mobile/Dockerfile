# ---- Build stage (Debian; Expo/Metro export web) ----
FROM node:20 AS build
WORKDIR /app
ENV EXPO_NO_TELEMETRY=1
ENV CI=1

# Copia manifestos + pacote shared + o app mobile (não puxa services/api).
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/mobile ./apps/mobile
RUN npm install --include=dev --no-audit

# Exporta o app para web estático (metro). A URL da API e as chaves do Supabase
# já estão em apps/mobile/app.json (extra.apiUrl / supabaseUrl / supabaseAnonKey).
RUN cd apps/mobile && npx expo export --platform web --output-dir dist

# ---- Production stage (nginx estático) ----
FROM nginx:alpine
COPY --from=build /app/apps/mobile/dist /usr/share/nginx/html
COPY --from=build /app/apps/mobile/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
