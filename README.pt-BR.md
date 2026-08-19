<div align="center">
  <h1>🚀 Dashboard Analítico de Cripto</h1>

  <p>
    <strong>Plataforma de nível corporativo para rastreamento, comparação e análise do mercado de criptomoedas.</strong>
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

## 📖 Visão Geral

O **Dashboard Analítico de Cripto** é uma aplicação web de alta performance desenhada para fornecer visões gerais do mercado em tempo real e comparações detalhadas de moedas lado a lado. Construído com foco em **resiliência, velocidade e arquitetura limpa**, ele agrega dados de múltiplos provedores de alto nível (Binance, CoinGecko, CoinCap) para garantir máximo tempo de atividade (uptime) e precisão dos dados.

## ✨ Principais Funcionalidades

- **📊 Visão do Mercado:** Visualize as 7 moedas de maior volume e as 7 com maiores ganhos em tempo real.
- **⚖️ Comparação Lado a Lado:** Compare até 5 criptomoedas simultaneamente com dados normalizados.
- **🛡️ Resiliência Corporativa:** Implementa os padrões **Circuit Breaker** e **Strategy**. Se o provedor de dados primário (Binance) falhar ou limitar requisições (rate-limit), o sistema recorre graciosamente aos provedores secundários (CoinGecko/CoinCap) sem derrubar a requisição do usuário.
- **⚡ Cache com Degradação Graciosa:** Utiliza uma camada inteligente de cache. Se o cluster Redis distribuído estiver indisponível (`ECONNREFUSED`), o sistema faz fallback automático para um cache em memória, evitando quedas na inicialização do servidor.
- **🤖 Testes E2E Automatizados:** Scripts integrados com Playwright para inspeção visual automatizada da interface e verificação de dados.

## 🏗️ Arquitetura e Stack Tecnológico

Este projeto está estruturado como um **Monorepo** para separar responsabilidades, mantendo o compartilhamento de tipos e utilitários.

### 🧱 Estrutura do Monorepo

```text
dashboard-cripto/
├── apps/
│   ├── api/       # NestJS Backend (Agregação de Dados e Cache)
│   └── web/       # Next.js / React Frontend (Tailwind UI)
├── packages/
│   └── shared-types/ # Interfaces TypeScript compartilhadas
└── test-playwright.mjs # Script de verificação de UI E2E
```

### 🛠️ Tecnologias Utilizadas
- **Frontend:** React, Next.js, Tailwind CSS.
- **Backend:** NestJS, RxJS (HttpService), Cache-Manager.
- **Testes:** Playwright (Automação de UI/Headless).
- **Ferramentas:** npm workspaces, Prettier, ESLint.

## 🚀 Como Começar

### Pré-requisitos
- Node.js (v18 ou superior)
- npm (v9 ou superior)

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/sua-org/dashboard-cripto.git
   cd dashboard-cripto
   ```

2. Instale as dependências para todos os workspaces:
   ```bash
   npm install
   ```

### Executando o Projeto

**1. Iniciar a API (Backend):**
```bash
npm run start:dev --workspace=@dashboard-cripto/api
```
*A API rodará em `http://localhost:3001` (ou na porta configurada).*

**2. Iniciar a Aplicação Web (Frontend):**
```bash
npm run dev --workspace=@dashboard-cripto/web
```
*A interface estará disponível em `http://localhost:3000`.*

### Executando Testes E2E
Para verificar visualmente os componentes da UI e o carregamento dos dados:
```bash
node test-playwright.mjs
```

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` nos diretórios `apps/api` e `apps/web`.

**Backend (`apps/api/.env`):**
```env
PORT=3001
# Opcional: Se omitido, faz fallback para cache em memória
REDIS_HOST=localhost 
REDIS_PORT=6379
```

**Frontend (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🧠 Decisões Arquiteturais (Resumo ADR)

*   **Por que Múltiplos Provedores?** APIs de cripto são notoriamente voláteis. Depender exclusivamente de uma única API cria um ponto único de falha. Utilizamos a Binance para dados massivos de liquidez e CoinGecko/CoinCap para metadados ricos (como imagens HD) e sistema de contingência.
*   **Por que restringir a comparação a 5 moedas?** Renderizar gráficos pesados em SVG/Canvas para dezenas de ativos causa bloqueios massivos na thread de UI (jank). Restringir a 5 garante rolagem a 60fps e legibilidade clara.

## 🤝 Contribuindo
1. Faça o Fork do Projeto.
2. Crie sua Branch de Feature (`git checkout -b feature/FeatureIncrivel`).
3. Faça o Commit das suas Mudanças (`git commit -m 'Adiciona uma FeatureIncrivel'`).
4. Faça o Push para a Branch (`git push origin feature/FeatureIncrivel`).
5. Abra um Pull Request. Certifique-se de que todos os testes do Playwright passam e os princípios de Clean Code sejam rigorosamente seguidos.

## 📜 Licença
Distribuído sob a Licença MIT. Veja `LICENSE` para mais informações.
