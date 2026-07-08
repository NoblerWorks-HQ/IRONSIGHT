# syntax=docker/dockerfile:1

# IRONSIGHT — multi-stage build producing a slim, standalone Next.js runtime.
# No API keys or env vars are required at build or run time.

# 1) Install dependencies (cached unless package*.json change)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) Build the standalone server bundle
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) Minimal runtime image — only the standalone output + static assets
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# The standalone output includes a minimal server.js + only the node_modules it needs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
