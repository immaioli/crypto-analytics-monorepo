import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation and Caching E2E', () => {
  // Vamos pausar a página (deixar o navegador aberto) indefinidamente ao final usando page.pause().
  test('Should navigate tabs, search multiple coins, and validate layout', async ({ page }) => {
    test.setTimeout(86400000); // 24 hours just in case
    // Acessa o dashboard local
    await page.goto('/');

    // 1. Confirma que a página carregou a listagem de Top Coins
    await expect(page.getByRole('heading', { name: 'Crypto Analytics' })).toBeVisible({ timeout: 15000 });

    const coinsToTest = ['PEPE', 'ACH', 'ASTER', 'HEYAURA'];

    for (const coin of coinsToTest) {
      console.log(`Testing search for ${coin}...`);
      const searchInput = page.getByPlaceholder('Search any coin ID');
      await searchInput.fill(coin);
      const searchButton = page.getByRole('button', { name: 'Search' });
      await searchButton.click();

      // Wait for fetch
      await page.waitForTimeout(2000);

      // Verify Deep Dive stats are rendering properly for this coin
      const tabDeepDive = page.getByRole('tab', { name: 'Deep Dive Stats' });
      await tabDeepDive.click();
      await page.waitForTimeout(1000);

      // Verify the fallback name doesn't look broken
      const title = page.locator('div', { hasText: 'Fundamental Metrics' }).first();
      await expect(title).toBeVisible();

      // Click to pre-cache comparison
      const tabCompare = page.getByRole('tab', { name: 'Performance Compare' });
      await tabCompare.click();
      await page.waitForTimeout(1000);

      const tabOhlc = page.getByRole('tab', { name: 'Price Action (OHLC)' });
      await tabOhlc.click();
      await page.waitForTimeout(1000);
    }

    console.log("Teste de UI concluído. O navegador e o Inspector permanecerão abertos.");
    await page.pause();
  });
});
