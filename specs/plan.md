# Implementation Plan (Crypto Dashboard)

This plan materializes the definitions from `spec.md` while respecting the `constitution.md`.

## 1. Overall System Architecture
The system will use a containerized client-server architecture orchestrated via **Docker Compose**:
- **`redis`:** Isolated container with Alpine Redis. (Port: 6379)
- **`api`:** NestJS back-end, connecting to Redis via environment variables, exposing REST endpoints on port 3001.
- **`web`:** Next.js 14 front-end, consuming the local `api` (internal proxy/route), running on port 3000.

## 2. Back-end Design (NestJS)
- **`CryptoModule`:** Centralizes fetching and normalization logic.
- **HttpService (Axios):** Exclusive consumer of CoinGecko's base_url (`api.coingecko.com/api/v3`).
- **Cache Interceptor:** A custom interceptor or `@nestjs/cache-manager` integration with a Redis store covering all endpoints.
- **Contracts (DTOs):** Normalized responses that exclude useless CoinGecko data, sending only what the front-end needs.

### Back-end Computation (Article I)
The `/api/v1/coins/compare` route will receive raw historical data from CoinGecko and execute base-0 indexing. Logical example:
For each coin, the price at index `0` becomes `100%`. All subsequent prices are calculated as relative percentages to price 0, allowing direct visual stacking of multiple coins (like BTC and ETH) in Lightweight Charts.

## 3. Front-end Design (Next.js)
- **State Management (TanStack Query):** `useQuery` with complex keys (e.g., `['coin', id, period, 'ohlc']`). This manages the client cache and deduplicates simultaneous requests for switched tabs.
- **Primary Chart Engine (Time Series):** `lightweight-charts`. Requires creating a React hook or component for imperative mount/unmount inside a `useEffect`.
- **Secondary Chart Engine (Categorical Data):** `recharts` for modular charts, such as Donut and Radar.

## 4. Monorepo Structure (Simplified)
```text
/dashboard-cripto
├── docker-compose.yml
├── /packages
│   └── /shared-types       <-- Contracts (TypeScript Interfaces)
├── /apps
│   ├── /api                <-- NestJS
│   └── /web                <-- Next.js
└── /specs                  <-- Spec-kit Artifacts
```

*Note: Using npm/pnpm workspaces simplifies linking `shared-types` locally without needing to publish packages.*
