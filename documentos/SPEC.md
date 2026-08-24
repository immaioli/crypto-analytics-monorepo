# Crypto Dashboard - Spec Driven Development (SDD)

## 1. Visão Geral do Projeto
O **Crypto Dashboard** é uma aplicação Full-Stack desenvolvida para o acompanhamento e visualização de dados do mercado de criptomoedas em tempo real e histórico. O sistema foi concebido como um **Monorepo** utilizando Turborepo, separando a lógica de negócios e integração de APIs (Backend/API) da camada de visualização e interface do usuário (Frontend/Web). 

A motivação do projeto é oferecer um agregador robusto que, através da consulta a múltiplos provedores (Binance, CoinGecko, CoinPaprika), mitiga falhas de Rate Limit e indisponibilidades, entregando informações detalhadas como Preços Ao Vivo, Métricas Fundamentais, All-Time High/Low (ATH/ATL) e Gráficos de Candlestick (OHLC).

## 2. Arquitetura e Stack Tecnológico
O repositório está estruturado sob a pasta `apps/` e `packages/`, com a seguinte stack:

- **Monorepo Manager:** Turborepo (`turbo`), npm workspaces.
- **Backend (API):** NestJS, TypeScript, RxJS, WebSocket Server (Socket.io).
- **Frontend (Web):** Next.js 14 (App Router), React, TailwindCSS, `next-intl` (i18n), Recharts, Lightweight Charts (TradingView).
- **Testes E2E:** Playwright.
- **Integração Externa (Providers):**
  - Binance (REST & WebSockets)
  - CoinGecko (REST - Mercados, Histórico)
  - CoinPaprika (REST - Tickers, Rank)
- **Caching:** In-memory Cache via `@nestjs/cache-manager` com workers rodando em background (`@nestjs/schedule` / Cron Jobs) para pre-fetching (Pré-carga).

## 3. Especificações do Backend (`apps/api`)
### 3.1. Estratégia de Provedores e Resiliência
- Implementação de um padrão de **Fallback Automático** (`tryWithFallback`), onde se o Provedor Principal falha por limite de requisições (Status 429/402), o próximo provedor na fila assume a resposta.
- **Pre-loading via Cron Job:** Para evitar lentidão na interface e N/A nos dados devido ao rate limit de chamadas simultâneas, o `CryptoService` possui um worker configurado com `@Cron(CronExpression.EVERY_MINUTE)` que realiza o download preventivo de todos os dados (OHLC, Ticker, History) das Top 14 moedas, alimentando o Cache.

### 3.2. Agregação Simultânea (`Promise.allSettled`)
- Especificamente para os dados profundos das moedas (Deep Dive), o backend abandona o padrão "Circuit Breaker" e passa a efetuar chamadas concorrentes para todos os 3 provedores através do método estendido `CryptoService.getCoinSummary`.
- O objetivo é extrair **todos** os atributos exclusivos que cada API fornece. Os dados retornados são mapeados para uma propriedade abstrata `capsules: ProviderCapsule[]`.

### 3.3. WebSockets (Live Ticker)
- Implementação do `BinanceGateway` usando `@nestjs/websockets`.
- Mantém conexão ativa em streams nativos da Binance WSS e faz um relé (relay) unificado para os clientes conectados no Dashboard.

## 4. Especificações do Frontend (`apps/web`)
### 4.1. Suporte a Multi-Idiomas (i18n)
- A aplicação foi estruturada para suportar `en-US` e `pt-BR`.
- Uso da biblioteca `next-intl` com roteamento interceptado na Edge via `middleware.ts` (Dynamic Segments em `app/[locale]/`).

### 4.2. Layout e Responsividade (Incluindo Mobile Spec)
- A interface é dividida em **Abas (Tabs):** "Overview", "Price Action (OHLC)" e "Deep Dive Stats".
- **Mobile Spec (Menor que 800px):** O componente de navegação (`Tabs.tsx`) se converte de Botões em Linha (Flex) para um **Menu Dropdown** (Select HTML nativo ou Custom Component) garantindo que o espaço lateral não quebre a interface em dispositivos móveis. As listas e gráficos usam propriedades Tailwind de redução (ex: `w-full`, `overflow-x-auto`).

### 4.3. Interface de Dados (Cápsulas)
- **Deep Dive Stats:** O layout em Cards foi substituído pelo padrão de "Cápsulas" (Badges com `flex-wrap`). As cápsulas são auto-geradas mapeando o nó `selectedCoin.capsules`, garantindo escalabilidade caso novos provedores sejam adicionados pela API.

## 5. Dicionário de Tipos Compartilhados (`packages/shared-types`)
Contrato entre API e Web, os tipos principais garantem o Intellisense ponta-a-ponta:
- `CoinSummary`: Dados agregados (symbol, price, changes 24h/7d/30d, ATH, ATL).
- `ProviderCapsule`: Estrutura `{ label, value, provider, type }` para exibição agnóstica de dados no front-end.
- `OhlcData`: Formato padronizado Timestamp, Open, High, Low, Close para a biblioteca de gráficos.

## 6. Critérios de Aceite
- [x] O sistema não deve exibir dados "N/A" para moedas principais sob limitação de API.
- [x] A página deve traduzir dinamicamente via `/en-US` ou `/pt-BR`.
- [x] Testes do Playwright (ex: `live-ticker.spec.ts`, `dashboard.spec.ts`) devem confirmar a renderização gráfica de ATH/ATL.
- [x] O menu mobile deve converter as abas em dropdown em resoluções `<=800px`.