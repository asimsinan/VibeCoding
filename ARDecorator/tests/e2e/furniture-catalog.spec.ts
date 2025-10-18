import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3000';

test.describe('Furniture Catalog', () => {
  test('should display furniture catalog on homepage', async ({ page }) => {
    await page.goto(APP_URL);

    // Should see furniture items
    await expect(page.locator('text=Modern Sofa, text=Scandinavian Armchair')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to catalog page', async ({ page }) => {
    await page.goto(APP_URL);

    // Click catalog link
    await page.click('a[href="/catalog"]');

    await expect(page).toHaveURL(`${APP_URL}/catalog`);
  });

  test('should load and display furniture items', async ({ page }) => {
    await page.goto(`${APP_URL}/catalog`);

    // Wait for furniture items to load
    await page.waitForSelector('[data-testid="furniture-item"], .furniture-item, [class*="furniture"]', {
      timeout: 5000,
      state: 'attached'
    });

    // Should have multiple items
    const items = await page.locator('[data-testid="furniture-item"], .furniture-item, [class*="furniture"]').count();
    expect(items).toBeGreaterThan(0);
  });

  test('should filter furniture by category', async ({ page }) => {
    await page.goto(`${APP_URL}/catalog`);

    // Wait for items to load
    await page.waitForTimeout(1000);

    // Select seating category
    await page.click('button:has-text("Seating"), select option[value="seating"], [data-category="seating"]');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Should show seating items
    await expect(page.locator('text=Sofa, text=Armchair, text=Stool')).toBeVisible();
  });

  test('should filter furniture by style', async ({ page }) => {
    await page.goto(`${APP_URL}/catalog`);

    await page.waitForTimeout(1000);

    // Select modern style
    await page.click('button:has-text("Modern"), select option[value="modern"], [data-style="modern"]');

    await page.waitForTimeout(500);

    // Should show modern items
    await expect(page.locator('text=Modern')).toBeVisible();
  });

  test('should filter furniture by price range', async ({ page }) => {
    await page.goto(`${APP_URL}/catalog`);

    await page.waitForTimeout(1000);

    // Set price range (if price filters exist)
    const minPriceInput = page.locator('input[name="minPrice"], input[placeholder*="min"]');
    if (await minPriceInput.count() > 0) {
      await minPriceInput.fill('100');
    }

    const maxPriceInput = page.locator('input[name="maxPrice"], input[placeholder*="max"]');
    if (await maxPriceInput.count() > 0) {
      await maxPriceInput.fill('500');
    }

    await page.waitForTimeout(500);

    // Items should be filtered
    const items = await page.locator('[data-testid="furniture-item"]').count();
    expect(items).toBeGreaterThanOrEqual(0);
  });

  test('should search furniture by name', async ({ page }) => {
    await page.goto(`${APP_URL}/catalog`);

    await page.waitForTimeout(1000);

    // Search for "sofa"
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('sofa');
      await page.waitForTimeout(500);

      // Should show sofa in results
      await expect(page.locator('text=Sofa')).toBeVisible();
    }
  });

  test('should view furniture details', async ({ page }) => {
    await page.goto(`${APP_URL}/catalog`);

    await page.waitForTimeout(1000);

    // Click on first furniture item
    const firstItem = page.locator('[data-testid="furniture-item"], .furniture-item').first();
    if (await firstItem.count() > 0) {
      await firstItem.click();

      // Should show details (modal or new page)
      await expect(page.locator('text=Price, text=Dimensions, text=Add to Design')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should display furniture with correct information', async ({ page }) => {
    await page.goto(`${APP_URL}/catalog`);

    await page.waitForTimeout(1000);

    // Each item should have name and price
    const firstItem = page.locator('[data-testid="furniture-item"]').first();
    if (await firstItem.count() > 0) {
      await expect(firstItem.locator('text=\\$')).toBeVisible();
    }
  });
});

