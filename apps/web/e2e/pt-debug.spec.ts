import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test('PT page debug - check what tabs are shown', async ({ page }) => {
  await page.goto(`${BASE}/pt-BR`);
  await page.waitForTimeout(5000);

  // Get all tabs
  const tabs = page.getByRole('tab');
  const tabCount = await tabs.count();
  console.log('Total tabs:', tabCount);
  for (let i = 0; i < tabCount; i++) {
    const t = tabs.nth(i);
    console.log(`  Tab ${i}: name="${await t.innerText()}" aria-selected=${await t.getAttribute('aria-selected')}`);
  }

  // Check header
  const headerTitle = await page.getByText('Análise de Criptomoedas').count();
  const headerSubtitle = await page.getByText('Dashboard Profissional').count();
  console.log('Header title "Análise de Criptomoedas" count:', headerTitle);
  console.log('Header subtitle "Dashboard Profissional" count:', headerSubtitle);
});