# Architecture and Execution Plan: Crypto Dashboard

This document details the technical specifications, architecture, and workflow for the Crypto Dashboard project. The project will be developed using GitHub's spec-kit to ensure alignment between intent and implementation.

## 1. Overview
An interactive dashboard monitoring the Top 10 cryptocurrencies by market cap, offering multiple graphical perspectives for analysis beyond the traditional candlestick chart.

- **Focus:** Rendering performance, Clean Layer Separation, and DevOps Maturity.
- **Process:** Spec-Driven Development (via github/spec-kit) and a rigorous testing workflow.

## 2. Architectural Decisions and Stack
There is no room for "or" in this architecture. The choices reflect Staff-level practices.

- **Back-end:** NestJS (TypeScript).
  - *Rationale:* Demonstrates mastery in modular architecture, Dependency Injection, and Decorator-based patterns, standing out from trivial Express APIs.
- **Cache & Rate Limit:** Redis running via Docker Compose.
  - *Rationale:* CoinGecko imposes a 100 req/min limit on the free tier. Redis acts as a protection layer.
- **Front-end:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS.
- **Chart Engines:** Lightweight Charts (TradingView) + Recharts.
  - *Rationale:* Lightweight Charts is the financial gold standard for performant OHLC/Canvas; Recharts handles declarative SVGs for composition (Donut, Radar, Bars).
- **Data State Management:** React Query (TanStack Query) v5.
- **Local Infrastructure:** Docker Compose orchestrating `api`, `web`, and `redis`.

## 3. API Contracts (NestJS -> Next.js)
TypeScript types will be shared in a monorepo or package. All routes exposed under `/api/v1/`.

1. `GET /api/v1/coins/top`
   - Returns an array with id, symbol, name, price, mcap, volume, price_change_24h.
   - Source: CoinGecko `/coins/markets`
   - Cache TTL: 60s.
2. `GET /api/v1/coins/:id/ohlc?days=X`
   - Returns an array of `[timestamp, open, high, low, close]`.
   - Source: CoinGecko `/coins/{id}/ohlc`
   - Cache TTL: 5 mins for 1d, 1 hour for >7d.
3. `GET /api/v1/coins/:id/history?days=X`
   - Returns time-series data for price and volume.
   - Source: CoinGecko `/coins/{id}/market_chart`
4. `GET /api/v1/coins/compare?ids=btc,eth&days=30`
   - Computes base-0 indexed percentage variation on the back-end.
   - *Staff Rationale:* The front-end renders, the back-end computes. Sending raw data and forcing the client to normalize comparison bases kills mobile performance and drains battery.

## 4. Mapped Visualizations
1.  **Candle Chart:** (Lightweight Charts) Precise OHLC with crosshair.
2.  **Line/Area Chart:** (Lightweight Charts) Closing price with a gradient area.
3.  **Volume Bars:** (Lightweight Charts) Bars attached to the secondary axis.
4.  **Heatmap/Treemap:** (Recharts) Top 10 Market Cap proportion.
5.  **Radar Chart:** (Recharts) Comparison of normalized metrics (Volatility, Volume, Mcap, Change).
6.  **Indexed Comparison:** (Lightweight Charts) Overlapping percentage variation.
7.  **Donut Chart:** (Recharts) Top 10 dominance distribution.

## 5. Engineering Process and Workflow (TTT + Spec-kit)
Development does not happen in generic sprints, but in strictly controlled cycles.

### Spec-Driven Setup (Phase 0)
Establish the core specifications:
- `constitution.md`: Project principles (Library-first, Test-first).
- `spec.md`: Requirements definition without technical constraints.
- `plan.md`: Detailed technical decisions.

### Test-to-Task (TTT) Protocol
For every task generated, the following flow is strict:
1. **Task Selection:** Start task `X`.
2. **Test Setup:** The test (unit or integration) is written BEFORE the code.
3. **Implementation:** Write the feature.
4. **Validation:** The task **only advances** if tests pass. Failures block progression.
5. **Review:** Notify the Lead (Irineu) with a summary.
6. **Approval and Commit:** ONLY AFTER APPROVAL, commit and push are executed. NO automatic pushes are allowed.

## 6. Execution Phases

### Phase 1: Docker & Infrastructure
- Monorepo setup.
- `docker-compose.yml` with Redis, base API service, and base Web service.
- Shared types and linting configuration.

### Phase 2: Back-end API & Cache Layer (NestJS)
- CoinGecko client integration (Axios/HttpModule).
- Interceptor layer for Redis Caching.
- Expose 4 `/api/v1/` endpoints with DTOs and Swagger OpenAPI.
- E2E Tests (Supertest) for endpoints.

### Phase 3: Front-end Base & Data Fetching (Next.js)
- Provider setup (React Query).
- Top 10 metrics Cards creation.
- Global error handling and loading skeletons (Suspense/Error Boundaries).

### Phase 4: Chart Engines
- React wrappers for Lightweight Charts.
- Recharts components implementation.
- Tab/view switching logic.

### Phase 5: Convergence and Polish
- Spec convergence validation.
- Layout adjustments, dark/light themes.
- Deployment documentation (Vercel/Railway).
