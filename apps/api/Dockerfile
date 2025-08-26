FROM oven/bun:1.2.20 AS base

FROM base AS builder
WORKDIR /app

# Install turbo globally
RUN bun add -g turbo@^2.5.6

# Copy everything
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune api --docker

# Installer stage
FROM base AS installer
WORKDIR /app

# Copy pruned files from builder
COPY --from=builder /app/out/full/ .

# Install dependencies with bun
RUN bun install --frozen-lockfile --production

# Build the app
RUN bunx turbo run build

# Production stage with only essential files
FROM base AS runner
WORKDIR /app

# Copy only the necessary files from the installer stage
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/package.json ./package.json
COPY --from=installer /app/apps/api/dist ./apps/api/dist
COPY --from=installer /app/apps/api/package.json ./apps/api/package.json

# Set environment variables
ENV NODE_ENV=production \
    HOSTNAME="0.0.0.0" \
    PORT=8000

USER bun
EXPOSE 8000

ENTRYPOINT [ "bun", "run", "apps/api/dist/index.js" ]
