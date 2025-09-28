FROM oven/bun:1.2.20 AS base

FROM base AS builder
WORKDIR /app

# Install turbo globally
RUN bun add -g turbo@^2.5.6

# Copy everything
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune web --docker

# Installer stage
FROM base AS installer
WORKDIR /app

# Install Python and build-essential
RUN apt-get update && apt-get install -y python3 build-essential

# Copy pruned files from builder
COPY --from=builder /app/out/full/ .

# Install dependencies with bun
RUN bun install --frozen-lockfile

# Build the app
RUN bunx turbo run build

# Production stage with only essential files
FROM base AS runner
WORKDIR /app

# Copy files from the installer stage
COPY --from=installer /app/apps/web/.output ./

ENV NODE_ENV=production \
  HOSTNAME="0.0.0.0" \
  PORT=3000

USER bun
EXPOSE 3000

# Start the application
CMD ["bun", "server/index.mjs"]