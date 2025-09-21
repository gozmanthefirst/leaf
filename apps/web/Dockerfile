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
RUN pnpm exec turbo run build

# Production stage with only essential files
FROM base AS runner
WORKDIR /app

# Copy files from the installer stage
COPY --from=installer /app/apps/web/.output ./

ENV NODE_ENV=production \
  HOSTNAME="0.0.0.0" \
  PORT=3000

USER nodejs
EXPOSE 3000

# Start the application
CMD ["node", "server/index.mjs"]