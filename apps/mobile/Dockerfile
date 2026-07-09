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

# Exporta o app para web estático
RUN cd apps/mobile && npx expo export --platform web --output-dir dist

# ---- Production stage (nginx) ----
FROM nginx:alpine
ENV PORT=8080
COPY --from=build /app/apps/mobile/dist /usr/share/nginx/html
COPY apps/mobile/default.conf.template /etc/nginx/templates/default.conf.template
COPY apps/mobile/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
