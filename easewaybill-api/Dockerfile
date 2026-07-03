# ─────────────────────────────────────────────────────────────────
# Stage 1 — Dependencies
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# ─────────────────────────────────────────────────────────────────
# Stage 2 — Builder
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source
COPY . .

# Build NestJS app
RUN npm run build

# ─────────────────────────────────────────────────────────────────
# Stage 3 — Production runner
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# Copy built app
COPY --from=builder /app/dist ./dist

# Copy any static assets if needed
# COPY --from=builder /app/public ./public

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start
CMD ["node", "dist/main"]