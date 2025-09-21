FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app

# Install turbo globally
RUN pnpm add -g turbo@^2.5.6

# Copy everything
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune api --docker

# Installer stage
FROM base AS installer
WORKDIR /app

# Copy pruned lockfile and package.json from builder
COPY --from=builder /app/out/json/ .

# Copy pruned files from builder
COPY --from=builder /app/out/full/ .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the app
RUN pnpm exec turbo run build

# Production stage with only essential files
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 hono

# Copy only the necessary files from the installer stage
COPY --from=installer /app/pnpm-workspace.yaml ./
COPY --from=installer /app/packages ./packages
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/package.json ./package.json
COPY --from=installer /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=installer /app/apps/api/dist ./apps/api/dist
COPY --from=installer /app/apps/api/package.json ./apps/api/package.json

# Set environment variables
ENV NODE_ENV=production \
    HOSTNAME="0.0.0.0" \
    PORT=8000

USER hono
EXPOSE 8000

CMD ["node", "apps/api/dist/src/server.js"]