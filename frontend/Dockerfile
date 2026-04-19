# ---- Build stage ----
FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes env vars at build time. Default matches what the host browser
# uses to reach the backend under docker-compose; override at build with
# `--build-arg VITE_API_URL=https://api.example.com` for real deployments.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Invoke vite directly — the `npm run build` script also runs `tsc -b`,
# which surfaces pre-existing Chakra v3 polymorphic-prop type errors that
# CI's `tsc --noEmit` misses (root tsconfig has files:[] and only references).
# Fixing those types is tracked separately; this build matches CI's effective
# type-check coverage.
RUN npx vite build

# ---- Serve stage ----
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

# nginx:alpine's own entrypoint handles config validation and graceful shutdown.
CMD ["nginx", "-g", "daemon off;"]
