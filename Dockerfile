# Multi-stage Dockerfile for Ocean Pulse (PostgreSQL production)
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

RUN npm install

# Copy source files
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

# Generate Prisma Client & Build all workspaces
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy production artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Prisma needs the generated client at runtime
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3001

# On start: push schema to DB (idempotent), then start the server
CMD ["sh", "-c", "cd apps/api && npx prisma db push --accept-data-loss && cd /app && node apps/api/dist/index.js"]
