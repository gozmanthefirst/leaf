FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app

# Install turbo globally
RUN pnpm add -g turbo@^2.5.7

# Copy everything
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune web --docker

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
RUN pnpm exec turbo build

# Production stage with only essential files
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 tanstack

# Copy built app and BOTH node_modules
COPY --from=installer /app/apps/web/dist ./apps/web/dist
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/web/node_modules ./apps/web/node_modules

ENV NODE_ENV=production \
  HOSTNAME="0.0.0.0" \
  PORT=3000

USER tanstack
EXPOSE 3000

# Use pnpx to run the locally installed srvx
CMD ["pnpx", "srvx", "--prod", "-s", "../client", "./apps/web/dist/server/server.js"]