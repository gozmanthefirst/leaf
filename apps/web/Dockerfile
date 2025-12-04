FROM oven/bun:1.3.3 AS base

# --- PREPARE STAGE ---
FROM base AS prepare
WORKDIR /app

# Install turbo globally
RUN bun add -g turbo@^2.6.1

# Copy everything
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune web --docker

# --- BUILDER STAGE ---
FROM base AS builder
WORKDIR /app

# Prune and copy dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .

# Install dependencies
RUN bun install

# Copy the rest of the files (as they change more often)
COPY --from=prepare /app/out/full/ .

# Build the app
RUN bunx turbo run build

# --- RUNNER STAGE ---
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production \
    HOSTNAME="0.0.0.0" \
    PORT=3000

COPY --from=builder /app/apps/web/.output ./

USER bun
EXPOSE 3000

ENTRYPOINT [ "bun", "server/index.mjs" ]