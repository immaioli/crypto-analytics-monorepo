<div align="center">
  <h1>🚀 Crypto Analytics Dashboard</h1>

  <p>
    <strong>Enterprise-grade cryptocurrency tracking, comparison, and market analysis platform.</strong>
  </p>

  <p>
    🌍 <a href="README.md">English</a> | 
    🇧🇷 <a href="README.pt-BR.md">Português</a> | 
    🇲🇽 <a href="README.es-MX.md">Español</a>
  </p>

  <p>
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
    <img alt="NestJS" src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
    <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  </p>
</div>

---

## 📖 Overview

The **Crypto Analytics Dashboard** is a high-performance web application designed to provide real-time market overviews and detailed side-by-side coin comparisons. Built with a focus on **resilience, speed, and clean architecture**, it aggregates data from multiple top-tier providers (Binance, CoinGecko, CoinPaprika) to ensure maximum uptime and data accuracy.

## ✨ Key Features

- **📊 Market Overview:** View the top 7 highest volume coins and the top 7 gainers in real-time.
- **⚖️ Side-by-Side Comparison:** Compare up to 5 cryptocurrencies simultaneously with normalized data.
- **🛡️ Enterprise Resilience:** Implements the **Circuit Breaker** and **Strategy** patterns. If the primary data provider (Binance) fails or rate-limits, the system gracefully falls back to secondary providers (CoinGecko/CoinPaprika) without dropping the user request.
- **⚡ Graceful Degradation Caching:** Uses an intelligent caching layer. If the distributed Redis cluster is unavailable (`ECONNREFUSED`), the system automatically falls back to an in-memory cache, preventing boot crashes.
- **🤖 Automated E2E Testing:** Integrated Playwright scripts for automated visual UI inspection and data verification.

## 🏗️ Architecture & Tech Stack

This project is structured as a **Monorepo** to separate concerns while sharing types and utilities.

### 🧱 Monorepo Structure

```text
dashboard-cripto/
├── apps/
│   ├── api/       # NestJS Backend (Data Aggregation & Caching)
│   └── web/       # Next.js / React Frontend (Tailwind UI)
├── packages/
│   └── shared-types/ # Shared TypeScript interfaces
└── test-playwright.mjs # E2E UI verification script
```

### 🛠️ Technology Stack
- **Frontend:** React, Next.js, Tailwind CSS.
- **Backend:** NestJS, RxJS (HttpService), Cache-Manager.
- **Testing:** Playwright (Headless/UI automation).
- **Tooling:** npm workspaces, Prettier, ESLint.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/dashboard-cripto.git
   cd dashboard-cripto
   ```

2. Install dependencies for all workspaces:
   ```bash
   npm install
   ```

### Running the Project

**1. Start the API (Backend):**
```bash
npm run start:dev --workspace=@dashboard-cripto/api
```
*The API will run on `http://localhost:3001` (or your configured port).*

**2. Start the Web App (Frontend):**
```bash
npm run dev --workspace=@dashboard-cripto/web
```
*The UI will be available at `http://localhost:3000`.*

### Running E2E Tests
To visually verify the UI components and data loading:
```bash
node test-playwright.mjs
```

## ⚙️ Environment Variables

Create a `.env` file in the `apps/api` and `apps/web` directories.

**Backend (`apps/api/.env`):**
```env
PORT=3001
# Optional: If omitted, falls back to in-memory caching
REDIS_HOST=localhost 
REDIS_PORT=6379
```

**Frontend (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🧠 Architectural Decisions (ADR Summary)

*   **Why Multiple Providers?** Crypto APIs are notoriously volatile. Relying solely on one API causes single points of failure. We use Binance for massive liquidity data and CoinGecko/CoinCap for rich metadata (like HD images) and fallback.
*   **Why restrict to 5 comparison coins?** Rendering heavy SVG/Canvas charts for dozens of assets causes massive UI thread blocking (jank). Restricting to 5 ensures 60fps scrolling and clear legibility.

## 🤝 Contributing
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request. Ensure all Playwright tests pass and Clean Code principles are strictly followed.

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
