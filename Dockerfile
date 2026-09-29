# syntax=docker/dockerfile:1
# ──────────────────────────────────────────────
# Image de production TaskFlow, construite en plusieurs étapes (multi-stage)
# ──────────────────────────────────────────────

# ---- Étape 1 : base commune ----
FROM node:24-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

# ---- Étape 2 : dépendances de production uniquement ----
FROM base AS deps
# --ignore-scripts : le script "prepare" (husky) n'a pas de sens dans une image
RUN npm ci --omit=dev --ignore-scripts

# ---- Étape 3 : vérification (toutes les dépendances + lint + tests) ----
FROM base AS test
RUN npm ci --ignore-scripts
COPY . .
# Valeurs factices, limitées à cette commande (non conservées dans l'image)
RUN SECRET_KEY=test POSTGRES_USER=test POSTGRES_PASSWORD=test POSTGRES_DB=test \
    sh -c 'npm run lint && npm test'

# ---- Étape 4 : image finale, minimale ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json server.js ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
# Ne jamais exécuter l'application en root
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "server.js"]
