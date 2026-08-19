import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:3000', { timeout: 60000 });

  // Wait a generous time for any hydration/loading
  await page.waitForTimeout(5000);

  console.log('Check the UI visually to verify the 3-line card structure and translation');
  console.log('Since the search bar was removed per MVP requirements, we are just inspecting the cards.');

  console.log('Leaving browser open for 30 minutes for inspection. Check the UI directly!');
  await page.waitForTimeout(1800000);
})();
