# Production image for Fly.io. Two stages:
#   1. builder — installs all deps (incl. dev) and compiles TS → dist/.
#   2. runtime — only prod deps + dist/ on a lean alpine base.
#
# Build context: this directory (server/). The local-dev image lives at
# docker/Dockerfile.server and is unaffected by this file.
#
# Required runtime env (set via `fly secrets set`):
#   MONGO_URI         mongodb+srv://...
#   JWT_SECRET        signing key for session tokens
#   GOOGLE_CLIENT_ID  if Google sign-in is enabled
# Optional:
#   PORT              defaults to 8080 (also pinned in fly.toml [env])

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests first so the npm install layer caches when only source
# changes. npm ci is reproducible from the lockfile.
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Re-install with --omit=dev so devDependencies (tsx, @types/*, etc.)
# never reach the production image.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Uploads stream straight to Cloudflare R2 — no local writes — so we just
# need ownership for the unprivileged `node` user.
RUN chown -R node:node /app
USER node

EXPOSE 8080
CMD ["node", "dist/index.js"]
