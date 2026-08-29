# ==============================================================================
# Production Dockerfile for Strapi v5 on Railway / Cloud Containers
# ==============================================================================

FROM node:22-bookworm-slim AS build
WORKDIR /opt/app

# Install build dependencies for native compilation (better-sqlite3, pg, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Provide build-time fallback environment variables
ENV NODE_ENV=production
ENV ADMIN_JWT_SECRET=defaultAdminJwtSecret123456789012
ENV API_TOKEN_SALT=defaultApiTokenSalt123456789012
ENV TRANSFER_TOKEN_SALT=defaultTransferTokenSalt123456
ENV ENCRYPTION_KEY=defaultEncryptionKey123456789012
ENV JWT_SECRET=defaultJwtSecretForLMSPlatform123456
ENV APP_KEYS=defaultKey1,defaultKey2

RUN npm run build

# ==============================================================================
# Production Runner Stage
# ==============================================================================
FROM node:22-bookworm-slim
WORKDIR /opt/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /opt/app/package.json ./package.json
COPY --from=build /opt/app/package-lock.json ./package-lock.json
COPY --from=build /opt/app/node_modules ./node_modules
COPY --from=build /opt/app/dist ./dist
COPY --from=build /opt/app/public ./public
COPY --from=build /opt/app/config ./config
COPY --from=build /opt/app/src ./src
COPY --from=build /opt/app/types ./types
COPY --from=build /opt/app/favicon.png ./favicon.png

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

EXPOSE 1337

CMD ["npm", "run", "start"]
