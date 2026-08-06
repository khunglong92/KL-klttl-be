# Stage 1: Builder
FROM node:20 AS builder
WORKDIR /app

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
FROM node:20-slim
WORKDIR /app

# Non-root user (built-in in official node images)
USER node

# Copy production artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# ✅ Copy images folder để UploadService tìm thấy logo
COPY --from=builder /app/src/images ./src/images

EXPOSE 3000
CMD ["node", "dist/main.js"]