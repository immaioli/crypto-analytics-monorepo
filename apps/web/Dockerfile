FROM node:20-alpine AS base

# 1. Dependências e Build
FROM base AS builder
WORKDIR /app

# Necessário para algumas builds
RUN apk add --no-cache libc6-compat

# Copiar config root
COPY package.json package-lock.json ./
# Copiar arquivos de workspace cruciais
COPY packages/shared-types ./packages/shared-types
COPY apps/web ./apps/web

# Instalar tudo (inclusive devDependencies para o build)
RUN npm ci

# Executar build (gera a pasta .next/standalone dentro de apps/web)
RUN npm run build -w @dashboard-cripto/web

# 2. Imagem de Produção Leve
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# O Next.js standalone gera uma estrutura que exige que a gente copie a pasta standalone
# e a pasta public / static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Automaticaly leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000

# Standalone mode cria um server.js na raiz do workspace isolado
CMD ["node", "apps/web/server.js"]
