# ---- Build stage (Expo/Metro export web) ----
FROM node:20 AS build
WORKDIR /app
ENV EXPO_NO_TELEMETRY=1
ENV CI=1

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/mobile ./apps/mobile

RUN npm install --include=dev --no-audit

RUN npm run build -w @medconecta/shared

RUN cd apps/mobile && npx expo export --platform web --output-dir dist

# ---- Production stage (nginx hardcoded port 8080) ----
FROM nginx:alpine
COPY --from=build /app/apps/mobile/dist /usr/share/nginx/html
COPY apps/mobile/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
