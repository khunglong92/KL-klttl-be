# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Cài build tools (nếu Prisma/native deps cần)
RUN apk add --no-cache python3 g++ make bash

# Copy package files + cài deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy Prisma schema trước để cache layer
COPY prisma ./prisma
COPY src/images ./src/images
# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS app
RUN yarn build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy production artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# ✅ Copy images folder để UploadService tìm thấy logo
COPY --from=builder /app/src/images ./src/images

EXPOSE 3000
CMD ["node", "dist/main.js"]