# Production image: builds the React client, then runs the Express API which
# also serves the built client on one port.
#
# The SQLite database lives in /data - mount a persistent volume there,
# otherwise data is lost when the container is replaced.
#
# Required at runtime: APP_PASSWORD (and preferably SESSION_SECRET).
# The database starts empty (no personal data is in the image): sign in and use
# Settings > Import Data with your export / seed.private.json file.

# ---------- Build ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# ---------- Run ----------
FROM node:22-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000 \
    DATABASE_PATH=/data/budget.sqlite \
    BACKUP_DIR=/data/backups \
    SEED_ON_EMPTY=false

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server ./server
COPY --from=build /app/client/dist ./client/dist

# Runs as root on purpose: hosting volumes (Railway, Fly.io) are mounted root-owned,
# and a non-root user could not write the database file.
RUN mkdir -p /data

EXPOSE 5000
CMD ["node", "server/src/server.js"]
