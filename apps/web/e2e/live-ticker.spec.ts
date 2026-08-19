import { test, expect } from '@playwright/test';

test.describe('Live Trading Ticker', () => {
  test('Should render the Live indicator when connected to Binance WebSocket', async ({ page }) => {
    // Escuta os pacotes websocket pra debug do terminal
    page.on('websocket', ws => {
      console.log('WebSocket opened: ' + ws.url());
      ws.on('framesent', payload => console.log('Sent:', payload.payload));
      ws.on('framereceived', payload => console.log('Received:', payload.payload));
    });

    // 1. Acessa a dashboard e vai pra aba OHLC (Price Action)
    await page.goto('http://localhost:3000');
    
    // Clica na aba "Price Action (OHLC)"
    await page.click('button:has-text("Price Action")');
    
    // 2. Aguarda a aba carregar e o socket emitir
    const liveIndicator = page.locator('text=Live').first();
    
    // Aguarda no maximo 10 segundos para a conexão do socket ser aceita
    await expect(liveIndicator).toBeVisible({ timeout: 10000 });
    
    console.log("SUCCESS: 'Live' badge is blinking on the screen and connected!");
  });
});
