# Stage 1: Builder
FROM node:20 AS builder
WORKDIR /app

# Copy package files + cài deps (đầy đủ, bao gồm devDependencies để build)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS app
RUN yarn build

# Stage 2: Dependencies (chỉ cài production deps, không kéo theo devDependencies
# đã cài ở stage builder — giúp image production nhẹ hơn nhiều, deploy nhanh hơn)
FROM node:20 AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Lấy Prisma client đã generate từ stage builder (cùng version, tránh việc
# generate lại bằng npx có thể vô tình kéo về version prisma CLI khác)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Stage 3: Production
FROM node:20-slim
WORKDIR /app

# Non-root user (built-in in official node images)
USER node

# Copy production artifacts
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# prisma.config.js cần có mặt để "npx prisma migrate deploy --config=prisma.config.js"
# chạy được trong image production (bị bỏ sót khi tách stage deps ở trên)
COPY --from=builder /app/prisma.config.js ./prisma.config.js

# ✅ Copy images folder để UploadService tìm thấy logo
COPY --from=builder /app/src/images ./src/images

EXPOSE 3000
CMD ["node", "dist/main.js"]