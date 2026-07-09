# ---- Build stage (Debian; Expo/Metro export web) ----
FROM node:20 AS build
WORKDIR /app
ENV EXPO_NO_TELEMETRY=1
ENV CI=1

# Copia manifestos + pacotes + o app mobile
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/mobile ./apps/mobile
RUN npm install --include=dev --no-audit 2>&1 | grep -v "npm warn" || true

# Compila packages/shared ANTES de tentar usar no expo export (Metro precisa de dist/index.js)
RUN npm run build -w @medconecta/shared 2>&1 | grep -vE "npm warn" || true

# Exporta o app para web estático (metro). A URL da API e as chaves do Supabase
# já estão em apps/mobile/app.json (extra.apiUrl / supabaseUrl / supabaseAnonKey).
RUN cd apps/mobile && npx expo export --platform web --output-dir dist 2>&1

# ---- Production stage (nginx estático) ----
FROM nginx:alpine
COPY --from=build /app/apps/mobile/dist /usr/share/nginx/html
COPY --from=build /app/apps/mobile/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
