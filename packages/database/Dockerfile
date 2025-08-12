FROM oven/bun:1.2.20 AS base

FROM base AS builder
WORKDIR /app

# Install turbo globally
RUN bun add -g turbo@^2.5.5

# Copy everything
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune @repo/database --docker

# Installer stage
FROM base AS installer
WORKDIR /app

# Copy pruned files from builder
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/full/ .

# Install dependencies with bun
RUN bun install --frozen-lockfile

# Migrate the database
RUN cd packages/database && \
  bun db:migrate

# Production stage with only essential files
FROM ghcr.io/drizzle-team/gateway:latest