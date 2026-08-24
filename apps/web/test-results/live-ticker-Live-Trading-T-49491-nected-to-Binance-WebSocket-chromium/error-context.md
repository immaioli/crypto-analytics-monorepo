# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-ticker.spec.ts >> Live Trading Ticker >> Should render the Live indicator when connected to Binance WebSocket
- Location: e2e\live-ticker.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Price Action")')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Live Trading Ticker', () => {
  4  |   test('Should render the Live indicator when connected to Binance WebSocket', async ({ page }) => {
  5  |     // Escuta os pacotes websocket pra debug do terminal
  6  |     page.on('websocket', ws => {
  7  |       console.log('WebSocket opened: ' + ws.url());
  8  |       ws.on('framesent', payload => console.log('Sent:', payload.payload));
  9  |       ws.on('framereceived', payload => console.log('Received:', payload.payload));
  10 |     });
  11 | 
  12 |     // 1. Acessa a dashboard e vai pra aba OHLC (Price Action)
  13 |     await page.goto('http://localhost:3000/en');
  14 |     
  15 |     // Clica na aba "Price Action (OHLC)"
> 16 |     await page.click('button:has-text("Price Action")');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  17 |     
  18 |     // 2. Aguarda a aba carregar e o socket emitir
  19 |     const liveIndicator = page.locator('text=Live').first();
  20 |     
  21 |     // Aguarda no maximo 10 segundos para a conex�o do socket ser aceita
  22 |     await expect(liveIndicator).toBeVisible({ timeout: 10000 });
  23 |     
  24 |     console.log("SUCCESS: 'Live' badge is blinking on the screen and connected!");
  25 |   });
  26 | });
  27 | 
```