# ==============================================================================
# Production Dockerfile for Strapi v5 on Railway / Cloud Containers
# ==============================================================================

FROM node:22-alpine AS build
WORKDIR /opt/app

# Install build dependencies for native compilation (better-sqlite3, etc.)
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV NODE_ENV=production
RUN npm run build

# ==============================================================================
# Production Runner Stage
# ==============================================================================
FROM node:22-alpine
WORKDIR /opt/app

# Install runtime dependencies for vips/sqlite
RUN apk update && apk add --no-cache vips-dev

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
