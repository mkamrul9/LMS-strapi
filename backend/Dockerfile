# ==============================================================================
# Production Dockerfile for Strapi v5 on Railway
# ==============================================================================

FROM node:22-bookworm-slim

WORKDIR /opt/app

# Install native compilation toolchain (C++, Python) for node-gyp
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies deterministically
COPY package.json package-lock.json ./
RUN npm ci

# Copy all application source files
COPY . .

# Build-time environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

# Build the Strapi TypeScript server and Admin Panel bundle
RUN npm run build

EXPOSE 1337

CMD ["npm", "run", "start"]
