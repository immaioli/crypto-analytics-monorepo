# Implementation Plan (Crypto Dashboard)

This plan materializes the definitions from `spec.md` while respecting the `constitution.md`. It tracks the architectural evolution of the project from inception through production deployment and mobile responsiveness tuning.

## 1. Overall System Architecture
The system uses a containerized client-server architecture in a monorepo setup:
- **`api` (NestJS):** The backend brain. Connects to Redis via environment variables, executing all complex calculations (base-0 indexing, normalization) to protect the frontend thread.
- **`web` (Next.js 14):** The presentation layer. Exclusively consumes the local/production `api` through an internal proxy route.
- **Data Layer:** Uses Upstash Redis (production) or local Docker Redis to cache third-party API payloads, safeguarding against strict rate limits.

## 2. Back-end Design (NestJS)
- **Data Source Strategy (Resiliency):** Implemented a Strategy Pattern architecture (`BinanceCryptoService` as primary for websockets/REST and `CoinPaprikaCryptoService` as fallback) replacing the original CoinCap/CoinGecko dependency due to rate limits and geo-blocks.
- **`CryptoModule`:** Centralizes fetching and normalization logic.
- **Background Jobs (Cron):** Heavy polling is managed via `@nestjs/schedule` to proactively warm the Redis cache independently of user requests.
- **Cache Interceptor:** All endpoints are wrapped in a caching layer.
- **Contracts (DTOs):** Defined in the `@dashboard-cripto/shared-types` workspace package, enforcing end-to-end type safety between NestJS and Next.js.

### Back-end Computation (Article I)
The `/api/v1/coins/compare` route receives raw historical data and executes base-0 indexing on the server. For each coin, the price at index `0` becomes `100%`. All subsequent prices are calculated as relative percentages to price 0, allowing direct visual stacking of multiple coins (like BTC and ETH) in Lightweight Charts without punishing the mobile browser's CPU.

## 3. Front-end Design (Next.js)
- **State Management (TanStack Query):** `useQuery` handles the client cache and deduplicates simultaneous requests.
- **Real-Time Integration:** A custom `useLivePrices` hook utilizes `socket.io-client` connected to the NestJS WebSocket Gateway (which relays Binance streams) to pulse prices instantly.
- **Primary Chart Engine (Time Series):** `lightweight-charts` wrapped in React components for imperative mount/unmount memory safety.
- **Secondary Chart Engine (Categorical Data):** `recharts` for Radar, Volume Profiles, and Donut charts.
- **Mobile Responsiveness Strategy:**
  - Viewports `< 800px` use a native `<select>` dropdown instead of horizontal buttons for tabs (powered by a custom SSR-safe `useMediaQuery` hook).
  - Responsive padding (`p-3 sm:p-6`) and dynamic flex gaps (`gap-2 sm:gap-3`) guarantee element breathability and prevent horizontal overflow on devices down to 320px.
  - Hard truncation techniques on text elements inside flex containers to prevent layout shattering on long data strings (e.g., "Wrapped Bitcoin").

## 4. Production Deployment & CI/CD
- **API Deployment:** Deployed to Render.com. The monorepo setup required overriding the build commands to ensure `@nestjs/cli` compilation and shared types injection worked within Render's build environment. A Keep-Alive cron job (via GitHub Actions) prevents the free tier from sleeping.
- **Web Deployment:** Deployed to Vercel. Custom pre-build scripts and root-level installations were configured in Vercel to allow Next.js to access and compile the internal `@dashboard-cripto/shared-types` package without publishing it to NPM.
- **E2E Testing:** Playwright is integrated into the CI flow for visual state retention and UI regression testing.

## 5. Monorepo Structure
```text
/dashboard-cripto
├── .github/workflows       <-- CI/CD (Playwright, Keep-Alive)
├── /packages
│   └── /shared-types       <-- Contracts (TypeScript Interfaces)
├── /apps
│   ├── /api                <-- NestJS (Backend)
│   └── /web                <-- Next.js (Frontend)
├── /infra                  <-- Docker definitions (Redis, App)
└── /specs                  <-- Spec-kit Artifacts
```