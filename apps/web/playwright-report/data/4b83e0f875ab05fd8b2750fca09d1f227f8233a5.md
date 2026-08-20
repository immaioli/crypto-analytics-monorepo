# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard Navigation and Caching E2E >> Should navigate tabs, search multiple coins, and validate layout
- Location: e2e\dashboard.spec.ts:5:3

# Error details

```
Test timeout of 86400000ms exceeded.
```

```
Error: locator.fill: Test timeout of 86400000ms exceeded.
Call log:
  - waiting for getByPlaceholder('Search any coin ID')
    - waiting for "http://localhost:3000/" navigation to finish...
    - navigated to "http://localhost:3000/"

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - main [ref=f1e2]:
    - generic [ref=f1e3]:
      - generic [ref=f1e4]:
        - heading "Crypto Analytics" [level=1] [ref=f1e5]
        - paragraph [ref=f1e6]: Real-time market data and custom market overview
      - generic [ref=f1e9]:
        - textbox "Search by exact symbol (e.g. BTC, ACH)..." [ref=f1e10]
        - button "Search" [ref=f1e11] [cursor=pointer]
    - generic [ref=f1e15]:
      - generic [ref=f1e16]:
        - heading "Market Overview" [level=2] [ref=f1e17]
        - generic [ref=f1e18]: "Error loading coins: Failed to fetch"
      - generic [ref=f1e19]:
        - heading "Advanced Analytics" [level=2] [ref=f1e20]
        - generic [ref=f1e21]:
          - tablist [ref=f1e22]:
            - tab "Price Action (OHLC)" [selected] [ref=f1e23] [cursor=pointer]
            - tab "Performance Compare" [ref=f1e24] [cursor=pointer]
            - tab "Volume Profile" [ref=f1e25] [cursor=pointer]
            - tab "Radar Analysis" [ref=f1e26] [cursor=pointer]
            - tab "Deep Dive Stats" [ref=f1e27] [cursor=pointer]
          - generic [ref=f1e28]:
            - tabpanel "Price Action (OHLC)" [ref=f1e29]:
              - generic [ref=f1e30]:
                - generic [ref=f1e31]:
                  - generic [ref=f1e32]:
                    - img "Bitcoin" [ref=f1e33]
                    - generic [ref=f1e34]:
                      - generic [ref=f1e35]: Bitcoin
                      - generic [ref=f1e36]: BTC
                  - generic [ref=f1e38]:
                    - button "1D" [ref=f1e39] [cursor=pointer]
                    - button "7D" [ref=f1e40] [cursor=pointer]
                    - button "30D" [ref=f1e41] [cursor=pointer]
                - generic [ref=f1e42]:
                  - table [ref=f1e45]:
                    - row [ref=f1e46]:
                      - cell
                      - cell [ref=f1e47]:
                        - link "Charting by TradingView" [ref=f1e51] [cursor=pointer]:
                          - /url: https://www.tradingview.com/?utm_medium=lwc-link&utm_campaign=lwc-chart&utm_source=localhost/
                      - cell [ref=f1e56]
                    - row [ref=f1e60]:
                      - cell
                      - cell [ref=f1e61]
                      - cell [ref=f1e65]
                  - generic [ref=f1e68]:
                    - generic [ref=f1e69]: Highest High (Max ▲)
                    - generic [ref=f1e72]: Lowest High (Max ▼)
                    - generic [ref=f1e75]: Center Average
                    - generic [ref=f1e78]: Highest Low (Min ▲)
                    - generic [ref=f1e81]: Lowest Low (Min ▼)
                    - generic [ref=f1e84]: Current Price
            - tabpanel "Performance Compare":
              - generic:
                - generic:
                  - generic:
                    - button "Bitcoin Bitcoin BTC":
                      - img "Bitcoin"
                      - generic: Bitcoin
                      - generic: BTC
                    - button "Ethereum Ethereum ETH":
                      - img "Ethereum"
                      - generic: Ethereum
                      - generic: ETH
                    - button "Solana Solana SOL":
                      - img "Solana"
                      - generic: Solana
                      - generic: SOL
                    - button "USD1 USD1 USD1":
                      - img "USD1"
                      - generic: USD1
                      - generic: USD1
                    - button "Allora Allora ALLO":
                      - img "Allora"
                      - generic: Allora
                      - generic: ALLO
                    - button "Zcash Zcash ZEC":
                      - img "Zcash"
                      - generic: Zcash
                      - generic: ZEC
                    - button "XRP XRP XRP":
                      - img "XRP"
                      - generic: XRP
                      - generic: XRP
                    - button "Hemi Hemi HEMI":
                      - img "Hemi"
                      - generic: Hemi
                      - generic: HEMI
                    - button "Bitcoin BITCOIN":
                      - generic: Bitcoin
                      - generic: BITCOIN
                    - button "Ethereum ETHEREUM":
                      - generic: Ethereum
                      - generic: ETHEREUM
                  - generic:
                    - generic:
                      - button "1D"
                      - button "7D"
                      - button "30D"
                - generic:
                  - generic: Showing performance index (Base-0%) comparison.
                  - generic:
                    - generic:
                      - table:
                        - row:
                          - cell
                          - cell:
                            - link "Charting by TradingView":
                              - /url: https://www.tradingview.com/?utm_medium=lwc-link&utm_campaign=lwc-chart&utm_source=localhost/
                          - cell
                        - row:
                          - cell
                          - cell
                          - cell
            - tabpanel "Volume Profile":
              - generic:
                - generic:
                  - generic:
                    - img "Bitcoin"
                    - generic:
                      - generic: Bitcoin
                      - generic: BTC
                  - generic:
                    - generic:
                      - button "1D"
                      - button "7D"
                      - button "30D"
                - generic:
                  - generic:
                    - generic:
                      - table:
                        - row:
                          - cell
                          - cell:
                            - link "Charting by TradingView":
                              - /url: https://www.tradingview.com/?utm_medium=lwc-link&utm_campaign=lwc-chart&utm_source=localhost/
                          - cell
                        - row:
                          - cell
                          - cell
                          - cell
            - tabpanel "Radar Analysis":
              - generic:
                - generic:
                  - generic:
                    - img "Bitcoin"
                    - generic:
                      - generic: Bitcoin
                      - generic: BTC
                  - generic: Fundamental Analysis vs Top Market Average
                - generic:
                  - generic:
                    - generic:
                      - img:
                        - generic:
                          - generic:
                            - generic: Value (Price Index)
                            - generic: Liquidity (Volume)
                            - generic: Momentum (Direction)
                            - generic: Volatility (Risk)
                            - generic: Stability Profile
            - tabpanel "Deep Dive Stats":
              - generic:
                - generic: Fundamental Metrics & Quick Stats
                - generic:
                  - generic:
                    - img "Bitcoin"
                    - generic:
                      - heading "Bitcoin BTC" [level=2]
                      - generic:
                        - generic: $68,249.9900
                        - generic: ▲ 5.47%
                  - generic:
                    - generic:
                      - heading "Conversion (BRL)" [level=4]
                      - paragraph: R$ 368,549.9460
                      - paragraph: Est. at 1 USD = 5.4 BRL
                    - generic:
                      - heading "24h Trading Volume" [level=4]
                      - paragraph: $1547.01 Million
                      - paragraph: Liquidity indicator
                    - generic:
                      - heading "Price Delta (24h)" [level=4]
                      - paragraph: $3733.9570
                      - paragraph: Nominal value change
                    - generic:
                      - heading "Network Base" [level=4]
                      - paragraph: BTC
                      - paragraph: ● Active tracking
  - alert [ref=f1e87]
  - dialog [ref=f1e90]:
    - generic [ref=f1e91]:
      - generic [ref=f1e92]:
        - heading "Failed to compile" [level=4] [ref=f1e93]
        - generic [ref=f1e94]:
          - text: Next.js (14.1.4) is outdated
          - link "(learn more)" [ref=f1e96] [cursor=pointer]:
            - /url: https://nextjs.org/docs/messages/version-staleness
      - generic [ref=f1e97]:
        - generic [ref=f1e98]:
          - link "./src/hooks/useLiveTicker.ts:2:0" [ref=f1e99] [cursor=pointer]
          - generic [ref=f1e104]:
            - text: "Module not found: Can't resolve 'socket.io-client' 1 | import { useEffect, useState } from 'react'; > 2 | import { io, Socket } from 'socket.io-client'; 3 | 4 | export interface LiveTickerData { 5 | symbol: string;"
            - generic [ref=f1e105]:
              - link "https://nextjs.org/docs/messages/module-not-found" [ref=f1e106] [cursor=pointer]:
                - /url: https://nextjs.org/docs/messages/module-not-found
              - text: "Import trace for requested module:"
            - link "./src/components/features/OhlcChartFeature.tsx" [ref=f1e107] [cursor=pointer]
            - link "./app/page.tsx" [ref=f1e112] [cursor=pointer]
        - contentinfo [ref=f1e117]:
          - paragraph [ref=f1e118]: This error occurred during the build process and can only be dismissed by fixing the error.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Dashboard Navigation and Caching E2E', () => {
  4  |   // Vamos pausar a página (deixar o navegador aberto) indefinidamente ao final usando page.pause().
  5  |   test('Should navigate tabs, search multiple coins, and validate layout', async ({ page }) => {
  6  |     test.setTimeout(86400000); // 24 hours just in case
  7  |     // Acessa o dashboard local
  8  |     await page.goto('http://localhost:3000');
  9  | 
  10 |     // 1. Confirma que a página carregou a listagem de Top Coins
  11 |     await expect(page.getByRole('heading', { name: 'Crypto Analytics' })).toBeVisible({ timeout: 15000 });
  12 | 
  13 |     const coinsToTest = ['PEPE', 'ACH', 'ASTER', 'HEYAURA'];
  14 | 
  15 |     for (const coin of coinsToTest) {
  16 |       console.log(`Testing search for ${coin}...`);
  17 |       const searchInput = page.getByPlaceholder('Search by exact symbol');
> 18 |       await searchInput.fill(coin);
     |                         ^ Error: locator.fill: Test timeout of 86400000ms exceeded.
  19 |       const searchButton = page.getByRole('button', { name: 'Search' });
  20 |       await searchButton.click();
  21 | 
  22 |       // Wait for fetch
  23 |       await page.waitForTimeout(2000);
  24 | 
  25 |       // Verify Deep Dive stats are rendering properly for this coin
  26 |       const tabDeepDive = page.getByRole('tab', { name: 'Deep Dive Stats' });
  27 |       await tabDeepDive.click();
  28 |       await page.waitForTimeout(1000);
  29 | 
  30 |       // Verify the fallback name doesn't look broken
  31 |       const title = page.locator('div', { hasText: 'Fundamental Metrics' }).first();
  32 |       await expect(title).toBeVisible();
  33 | 
  34 |       // Click to pre-cache comparison
  35 |       const tabCompare = page.getByRole('tab', { name: 'Performance Compare' });
  36 |       await tabCompare.click();
  37 |       await page.waitForTimeout(1000);
  38 | 
  39 |       const tabOhlc = page.getByRole('tab', { name: 'Price Action (OHLC)' });
  40 |       await tabOhlc.click();
  41 |       await page.waitForTimeout(1000);
  42 |     }
  43 | 
  44 |     console.log("Teste de UI concluído. O navegador e o Inspector permanecerão abertos.");
  45 |     await page.pause();
  46 |   });
  47 | });
  48 | 
```