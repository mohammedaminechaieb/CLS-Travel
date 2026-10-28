# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl && corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# ---- deps + build ----
FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @cls/api... --ignore-scripts
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @cls/shared build \
 && pnpm --filter @cls/api exec prisma generate \
 && pnpm --filter @cls/api build \
 && pnpm deploy --filter @cls/api --prod --ignore-scripts /out \
 && cd /out && npx prisma generate

# ---- runtime ----
FROM node:20-alpine AS runtime
# Chromium + polices pour la génération PDF (Puppeteer)
RUN apk add --no-cache openssl wget chromium nss freetype harfbuzz ttf-freefont font-noto font-noto-arabic
ENV NODE_ENV=production \
    CHROMIUM_PATH=/usr/bin/chromium-browser
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 4000
# Les migrations sont lancées par le pipeline de déploiement : `npx prisma migrate deploy`
CMD ["node", "dist/main.js"]
