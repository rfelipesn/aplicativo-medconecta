# ---- Build stage ----
FROM node:20 AS build
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN npm install --include=dev --no-audit 2>&1 | grep -v "npm warn"

ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build -w @medconecta/shared 2>&1 | grep -vE "npm warn" || true
RUN npm run build -w @medconecta/web 2>&1 | grep -vE "npm warn" || true

# ---- Production ----
FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY --from=build /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
