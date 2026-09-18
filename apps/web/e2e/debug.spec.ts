import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test('Verify tab click changes active tab', async ({ page }) => {
  await page.goto(`${BASE}/en`);
  await page.waitForTimeout(5000);

  // Get all tabs
  const tabs = page.getByRole('tab');
  const tabCount = await tabs.count();
  console.log('Total tabs:', tabCount);
  for (let i = 0; i < tabCount; i++) {
    const t = tabs.nth(i);
    console.log(`  Tab ${i}: name="${await t.innerText()}" aria-selected=${await t.getAttribute('aria-selected')}`);
  }

  // Click Deep Dive Stats
  const deepDive = page.getByRole('tab', { name: 'Deep Dive Stats' });
  await deepDive.click();
  await page.waitForTimeout(3000);

  console.log('--- After clicking Deep Dive Stats ---');
  for (let i = 0; i < tabCount; i++) {
    const t = tabs.nth(i);
    console.log(`  Tab ${i}: name="${await t.innerText()}" aria-selected=${await t.getAttribute('aria-selected')}`);
  }

  // Check which tabpanel is visible
  const panels = page.locator('[role="tabpanel"]');
  const panelCount = await panels.count();
  console.log('Tabpanels:', panelCount);
  for (let i = 0; i < panelCount; i++) {
    const p = panels.nth(i);
    const isVisible = await p.isVisible();
    const opacity = await p.evaluate((el) => getComputedStyle(el).opacity);
    const tabId = await p.getAttribute('aria-labelledby');
    console.log(`  Panel ${i} (${tabId}): visible=${isVisible}, opacity=${opacity}`);
  }

  // Check the Deep Dive panel content
  const deepPanel = page.locator('[aria-labelledby="tab-tab-stats"]');
  if (await deepPanel.count() > 0) {
    const text = await deepPanel.innerText();
    console.log('--- Deep Dive panel text (first 1500 chars) ---');
    console.log(text.substring(0, 1500));
  }
});
