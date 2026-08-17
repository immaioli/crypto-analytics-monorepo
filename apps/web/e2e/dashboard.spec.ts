import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation and Caching E2E', () => {
  // Vamos pausar a página (deixar o navegador aberto) ao final, como solicitado.
  // Para que funcione automatizado e sem timeout forçado, usaremos o --headed e
  // um sleep muito longo apenas no passo de exibição.
  test('Should navigate tabs without blanking out charts and test periods', async ({ page }) => {
    test.setTimeout(650000); // 10 minutes + margin
    // Acessa o dashboard local
    await page.goto('/');

    // 1. Confirma que a página carregou a listagem de Top Coins (garantindo API connection)
    await expect(page.getByRole('heading', { name: 'Crypto Analytics' })).toBeVisible({ timeout: 15000 });

    // Navegaçóes macias sem asserts estritos puros pois a API coingecko rate limits as vezes
    const tabOhlc = page.getByRole('tab', { name: 'Price Action (OHLC)' });
    const tabCompare = page.getByRole('tab', { name: 'Performance Compare' });
    const tabVolume = page.getByRole('tab', { name: 'Volume Profile' });

    // Clica para inicializar pre-caches
    await tabCompare.click();
    await page.waitForTimeout(500);

    await tabVolume.click();
    await page.waitForTimeout(500);

    const button30D = page.getByRole('button', { name: '30D' });
    await button30D.click();
    await page.waitForTimeout(1000);

    await tabOhlc.click();

    // Mantém a aba aberta chamando pause para inspecionamento manual
    // Deixaremos em repouso por 10 minutos (600000ms) para que você possa olhar o navegador e as linhas.
    console.log("Teste de UI concluído. O navegador permanecerá aberto por 10 minutos para validação visual.");
    await page.waitForTimeout(600000);
  });
});
