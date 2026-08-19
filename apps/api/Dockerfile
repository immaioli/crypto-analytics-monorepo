FROM node:20-alpine AS base

# 1. Dependências e Build
FROM base AS builder
WORKDIR /app

# O Prisma ou outros pacotes que usem gyp podem precisar do python/make, mas não parece ser o caso.
RUN apk add --no-cache libc6-compat

# Copiar os jsons e arquivos de lock na raiz
COPY package.json package-lock.json ./
# Copiar o shared-types (A API depende dele)
COPY packages/shared-types ./packages/shared-types
# Copiar código da API
COPY apps/api ./apps/api

# Instala todas as dependências do monorepo (incluindo devDependencies)
RUN npm ci

# Compila o backend e os types
RUN npm run build -w @dashboard-cripto/api

# 2. Imagem final leve
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Na imagem final, só precisamos de pacotes de produção (remove devDependencies)
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/

# Instala apenas dependências de produção para reduzir vulnerabilidades e tamanho
RUN npm ci --omit=dev

# Copia os dists compilados
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]