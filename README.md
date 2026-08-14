<div align="center">
  <h1>Crypto Dashboard</h1>
  <p>
    <strong>A high-performance, real-time cryptocurrency analytics platform.</strong>
  </p>
  <p>
    Powered by NestJS, Next.js, and Redis, designed with a Spec-Driven Development architecture.
  </p>

  <p>
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#development-workflow">Development Workflow</a> •
    <a href="#api-contracts">API Contracts</a>
  </p>
</div>

---

## 🏗 Architecture

The Crypto Dashboard is built as a strict client-server separation using a modern monorepo structure.

### Core Stack
- **API (Back-end):** NestJS (TypeScript, ESNext) — Handles complex data normalization, base-0 indexing, and time-series aggregation.
- **Web (Front-end):** Next.js 14+ (App Router) — Exclusively a presentation layer. Consumes pre-computed data for maximum rendering efficiency.
- **Cache Layer:** Alpine Redis — Protects against strict 100 req/min rate limits from the external CoinGecko data provider.
- **Charting Engines:** [Lightweight Charts](https://www.tradingview.com/lightweight-charts/) (Time-series) & [Recharts](https://recharts.org/) (Categorical/Composition).
- **Orchestration:** Docker Compose locally for zero-configuration setup.

### Monorepo Structure

```text
/
├── apps/
│   ├── api/             # NestJS Back-end Service
│   └── web/             # Next.js Front-end Application
├── packages/
│   └── shared-types/    # Compile-time API contracts & DTOs
└── specs/               # Spec-Driven Development artifacts
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ or latest LTS)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or equivalent Compose runtime)
- CoinGecko Demo API Key ([Get one here](https://www.coingecko.com/en/api))

### 1. Environment Setup

Clone the repository and set up your local environment:

```bash
# Clone the repository
git clone https://github.com/immaioli/dashboard-cripto.git
cd dashboard-cripto

# Create your local environment file
cp .env.example .env

# Edit .env and insert your CoinGecko Demo API Key
nano .env
```

### 2. Install & Verify Infrastructure

Install dependencies and build the shared TypeScript contracts:

```bash
# Install dependencies across all workspaces
npm install

# Build shared types (required before starting apps)
npm run build:types

# Run infrastructure validation tests
npm run test:infra
```

### 3. Start the Environment

Boot the entire stack using Docker Compose:

```bash
npm run dev
```

The services will be available at:
- **Web Application:** [http://localhost:3000](http://localhost:3000)
- **API Health Check:** [http://localhost:3001/health](http://localhost:3001/health)
- **Redis Server:** `localhost:6379`

## ⚙️ Development Workflow

This project adheres to a strict **Spec-Driven Development (SDD)** and **Test-First** protocol.

### Test-First Protocol
1. No functional code is written before its corresponding unit or integration test.
2. Changes must be validated against `shared-types` boundaries.
3. Every task execution is halted if tests fail.

```bash
# Run all tests across the monorepo
npm test
```

### Modifying Shared Contracts
When updating types in `packages/shared-types`, you must rebuild the package before the API or Web apps can detect the changes:

```bash
npm run build:types
```

## 🔐 Security Guidelines
- **Never commit `.env` files.** The repository is protected by `.gitignore` rules, but extreme caution must be exercised with API keys.
- **CoinGecko Keys:** Do not expose the CoinGecko API key in the Next.js front-end. All external API fetching must occur securely within the NestJS back-end.

## 📄 Documentation
For detailed insights into the engineering principles governing this project, refer to the [ARCHITECTURE.md](./ARCHITECTURE.md) and the artifacts stored within the `/specs` directory.

---
*Developed by [Irineu Marcelo Maioli](https://maioli.dev.br).*
