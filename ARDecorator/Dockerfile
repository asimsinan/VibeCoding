# Multi-stage Dockerfile for AR Home Decorator

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy frontend source
COPY apps/web ./apps/web/
COPY packages ./packages/

# Build frontend
WORKDIR /app/apps/web
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm ci

# Copy backend source
COPY apps/api ./apps/api/
COPY packages ./packages/
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Build backend
WORKDIR /app/apps/api
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci --only=production

# Copy built files
COPY --from=backend-builder /app/apps/api/dist ./apps/api/dist
COPY --from=backend-builder /app/prisma ./prisma
COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=frontend-builder /app/apps/web/dist ./apps/web/dist

# Copy environment files
COPY apps/api/src/contracts ./apps/api/src/contracts

# Expose ports
EXPOSE 3001

# Set environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "apps/api/dist/server.js"]

