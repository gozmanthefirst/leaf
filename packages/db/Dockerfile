FROM oven/bun:1.2.20 AS base

FROM base AS builder
WORKDIR /app

# Install turbo globally
RUN bun add -g turbo@^2.5.6

# Copy everything
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune @repo/db --docker

# Installer stage
FROM base AS installer
WORKDIR /app

# Copy pruned files from builder
COPY --from=builder /app/out/full/ .

# Install dependencies with bun
RUN bun install --frozen-lockfile

# Migrate the database
RUN cd packages/db && \
  bun db:deploy

# Production stage with only essential files
FROM base AS runner
WORKDIR /app

# Copy only the necessary files from the installer stage
COPY --from=installer /app/packages/db ./packages/db
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/package.json ./package.json

# Set environment variables
ENV NODE_ENV=production \
    HOSTNAME="0.0.0.0" \
    PORT=5555

USER bun
EXPOSE 5555

# Run the studio
WORKDIR /app/packages/db
CMD ["bun", "prisma", "studio", "--port", "5555", "--hostname", "0.0.0.0"]