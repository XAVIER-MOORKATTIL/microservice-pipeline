# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci

# Stage 2: Production Execution Environment
FROM node:20-alpine
WORKDIR /usr/src/app

# Copy production artifacts
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .

# Environment Defaults
ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

# Start Engine
CMD ["node", "server.js"]