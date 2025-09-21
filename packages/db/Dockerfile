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
RUN turbo prune @repo/db --docker

# Installer stage
FROM base AS installer
WORKDIR /app

# Copy pruned lockfile and package.json from builder
COPY --from=builder /app/out/json/ .

# Copy source files
COPY --from=builder /app/out/full/ .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Migrate the db
RUN cd packages/db && \
  pnpm db:deploy

# Production stage with only essential files
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 prisma

# Copy only the necessary files from installer
COPY --from=installer /app/packages/db ./packages/db
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/package.json ./package.json

# Set environment variables
ENV NODE_ENV=production \
    HOSTNAME="0.0.0.0" \
    PORT=5555

USER prisma
EXPOSE 5555

# Run the studio
WORKDIR /app/packages/db
CMD ["pnpm", "prisma", "studio", "--port", "5555", "--hostname", "0.0.0.0"]
