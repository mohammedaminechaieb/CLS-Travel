# syntax=docker/dockerfile:1.7
# ---- base ----
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
 && (cd apps/api && ([ ! -f prisma/schema.prisma ] || pnpm exec prisma generate)) \
 && pnpm --filter @cls/api build \
 && pnpm deploy --filter @cls/api --prod /out \
 && cp -r apps/api/dist /out/dist \
 && ([ ! -d apps/api/prisma ] || cp -r apps/api/prisma /out/prisma) \
 && (cd /out && ([ ! -f prisma/schema.prisma ] || npx --yes prisma@6 generate))

# ---- runtime ----
FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl wget
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
