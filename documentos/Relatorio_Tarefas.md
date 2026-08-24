# Relatório de Tarefas e Execução - Crypto Dashboard

Este relatório documenta cronologicamente todas as tarefas executadas, desde o setup inicial até as refatorações arquiteturais do Monorepo.

## Fase 1: Fundação do Projeto (Setup do Monorepo)
1. **Configuração Turborepo:** Estruturação das pastas `apps/api`, `apps/web`, `packages/eslint-config`, `packages/typescript-config` e `packages/shared-types`.
2. **Setup do Backend (NestJS):** Instalação inicial e criação dos módulos de Crypto (Services, Controllers, Gateways).
3. **Setup do Frontend (Next.js):** Inicialização do App Router (Next 14), TailwindCSS, e instalação das bibliotecas de UI (Recharts, lightweight-charts, heroicons).

## Fase 2: Integração de APIs e Tratamento de Rate Limits
1. **Providers:** Implementação de 3 classes independentes: `BinanceClientService`, `CoinGeckoClientService` e `CoinPaprikaClientService`.
2. **Matemática e Normalização:** Criação do `CryptoMathService` para formatar e converter variações de retorno entre as APIs.
3. **Cache Manager:** Injeção do módulo de Cache in-memory do NestJS.
4. **Resolução de Conflitos de API:** Detecção de limites severos (HTTP 429 Gecko, HTTP 402 Paprika). Implementou-se inicialmente fallback sequencial.
5. **Pré-carga via Cron (Background Worker):** Criação da função `handleCronTopCoinsUpdate` rodando a cada 1 minuto para popular o Cache com dados de 14 moedas nativamente.

## Fase 3: Funcionalidades de Interface (Dashboard)
1. **Price Action (OHLC):** 
   - Renderização gráfica avançada das velas.
   - Integração com WebSocket (Live Ticker) originado da Binance e intermediado pela API local.
2. **ATH e ATL (All-Time High / Low):**
   - Extração do dado absoluto fornecido pelo endpoint de Markets da CoinGecko.
   - Refatoração dos cálculos para priorizar dados dos últimos 30 dias na visão padrão e "All-Time" na aba Price Action.
   - Adição visual do bloco ATH e ATL formatado monetariamente com suas respectivas datas históricas no frontend.

## Fase 4: Otimização e Evolução UI/UX
1. **Redesign "Deep Dive Stats":**
   - Substituição de "Grids" engessados por um container dinâmico `flex-wrap`.
   - Adição da interface `ProviderCapsule` ao Shared-Types.
   - Implementação de `Promise.allSettled()` no backend para colher e entregar todos os dados paralelos das 3 APIs e encapsulá-los (Ex: Market Cap Rank, Fully Diluted Valuation, etc).
2. **Adaptação Mobile:**
   - Criação da regra CSS/Hooks que detecta viewport `< 800px` alterando o sistema de abas para um `Select` Dropdown.

## Fase 5: Internacionalização (i18n)
1. **Instalação do `next-intl`:** Instalação e configuração de wrapper no `next.config.mjs`.
2. **Refatoração de Roteamento:** Movimentação massiva dos arquivos `app/layout.tsx` e `app/page.tsx` para `app/[locale]/layout.tsx` e `page.tsx`.
3. **Middleware:** Configuração do Edge proxy para direcionamento entre `pt-BR` e `en-US` baseado em cabeçalhos de navegador.
4. **Dicionários (JSON):** Criação dos arquivos estáticos substituindo strings hardcoded.

## Fase 6: Testes, QA e Restabelecimento de Ambiente
1. **Playwright:** Configuração e criação dos arquivos `live-ticker.spec.ts` e `dashboard.spec.ts`.
2. **Ambiente Dev:** Tentativa de execução local (`npm run dev`), que esbarrou em falhas sistêmicas no SO local (Falta de espaço no disco `C:\` e desmonte do drive virtual `F:\`).
3. **Resolução de Ambiente:** Orientação dada e seguida pelo desenvolvedor (usuário) para liberar espaço. Processos em background (Portas 3000 e 3001) foram encerrados de forma hard (Kill process ID) e reiniciados limpos.
4. **Execução de E2E Atual:** Testes do Playwright sendo executados e validados na aba gráfica do Chromium.

## Próximos Passos (Ações Pendentes)
- Análise de Diff do Git.
- Mapeamento e criação das mensagens de Commit em múltiplos arquivos lógicos.
- Aprovação do usuário para efetivação dos Commits (Hard Constraint da sessão).
