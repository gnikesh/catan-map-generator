# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first — layer cache: only re-run npm ci when deps change
COPY package.json package-lock.json* ./

RUN npm ci

# Copy source files and build
COPY . .

RUN npm run build

# ── Stage 2: Export ───────────────────────────────────────────────────────────
# Empty base image — used only for exporting the dist/ artifacts.
# Build with:
#   docker buildx build --target export --output type=local,dest=./dist .
FROM scratch AS export
COPY --from=builder /app/dist /
