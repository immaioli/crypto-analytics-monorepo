import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Validation: Deep Dive Capsules + i18n', () => {
  test('PT page shows Portuguese content with flag switcher', async ({ page }) => {
    await page.goto(`${BASE}/pt-BR`);

    // Header title is same in both, subtitle differs
    await expect(page.getByText('Dashboard Profissional')).toBeVisible({ timeout: 15000 });

    // PT tab labels visible (matching actual translations in pt-BR.json)
    await expect(page.getByRole('tab', { name: 'Visão Geral do Mercado' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Estatísticas Detalhadas' })).toBeVisible();

    // Both flag images present (using alt text from LanguageSwitcher component)
    await expect(page.getByAltText('Português')).toBeVisible();
    await expect(page.getByAltText('English')).toBeVisible();
  });

  test('EN page shows English content', async ({ page }) => {
    await page.goto(`${BASE}/en`);

    await expect(page.getByText('Professional Dashboard')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('tab', { name: 'Price Action (OHLC)' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Deep Dive Stats' })).toBeVisible();
  });

  test('Deep Dive Stats tab renders capsules', async ({ page }) => {
    await page.goto(`${BASE}/en`);

    // Wait for top coins to load
    await page.getByText('Bitcoin', { exact: false }).first().waitFor({ timeout: 15000 });

    // Click the first coin (Bitcoin) so useCoinSummary fires
    await page.getByText('Bitcoin', { exact: false }).first().click();
    await page.waitForTimeout(2000);

    // Click Deep Dive Stats tab
    const tab = page.getByRole('tab', { name: 'Deep Dive Stats' });
    await tab.click();
    await page.waitForTimeout(3000);

    // Categories: Real-Time Trading, Fundamentals & Supply, Risk & Volatility
    const hasRealtime = await page.getByText('Real-Time Trading').isVisible().catch(() => false);
    const hasFundamentals = await page.getByText('Fundamentals & Supply').isVisible().catch(() => false);
    const hasRisk = await page.getByText('Risk & Volatility').isVisible().catch(() => false);

    console.log('Real-Time section visible:', hasRealtime);
    console.log('Fundamentals section visible:', hasFundamentals);
    console.log('Risk section visible:', hasRisk);

    expect(hasRealtime || hasFundamentals || hasRisk).toBeTruthy();
  });
});
