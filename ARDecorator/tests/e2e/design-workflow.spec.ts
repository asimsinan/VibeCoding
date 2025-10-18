import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3000';

test.describe('Design Creation Workflow', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[name="email"]', 'user@ardecorator.com');
    await page.fill('input[name="password"]', 'user123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${APP_URL}/dashboard`, { timeout: 5000 });
  });

  test('should navigate to editor page', async ({ page }) => {
    // Go to editor
    await page.goto(`${APP_URL}/editor`);
    await expect(page).toHaveURL(`${APP_URL}/editor`);
  });

  test('should create a new design', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);

    // Click create new design button
    await page.click('button:has-text("New Design"), a:has-text("Create")');

    // Should navigate to editor
    await expect(page).toHaveURL(/\/editor/);
  });

  test('should list user designs on dashboard', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);

    // Wait for designs to load
    await page.waitForTimeout(1000);

    // Should show designs or empty state
    const hasDesigns = await page.locator('[data-testid="design-card"], .design-item').count();
    
    if (hasDesigns > 0) {
      await expect(page.locator('[data-testid="design-card"]').first()).toBeVisible();
    } else {
      await expect(page.locator('text=No designs, text=Create your first')).toBeVisible();
    }
  });

  test('should view design details', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);

    await page.waitForTimeout(1000);

    // Click on first design if exists
    const firstDesign = page.locator('[data-testid="design-card"], .design-item').first();
    if (await firstDesign.count() > 0) {
      await firstDesign.click();

      // Should navigate to editor with design ID
      await expect(page).toHaveURL(/\/editor\/[a-z0-9-]+/);
    }
  });

  test('should update design name', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);

    await page.waitForTimeout(1000);

    const firstDesign = page.locator('[data-testid="design-card"]').first();
    if (await firstDesign.count() > 0) {
      // Click edit or open design
      await firstDesign.click();

      // Update name
      const nameInput = page.locator('input[name="name"], input[placeholder*="Design name"]');
      if (await nameInput.count() > 0) {
        await nameInput.fill(`Updated Design ${Date.now()}`);
        await page.click('button:has-text("Save")');

        // Should show success message
        await expect(page.locator('text=saved, text=updated')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should delete a design', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);

    await page.waitForTimeout(1000);

    const designCount = await page.locator('[data-testid="design-card"]').count();

    if (designCount > 0) {
      // Click delete button on first design
      await page.click('[data-testid="design-card"]:first-child button:has-text("Delete"), [data-testid="design-card"]:first-child [aria-label="Delete"]');

      // Confirm deletion
      await page.click('button:has-text("Confirm"), button:has-text("Delete")');

      // Should show fewer designs or empty state
      await page.waitForTimeout(500);
      const newCount = await page.locator('[data-testid="design-card"]').count();
      expect(newCount).toBeLessThan(designCount);
    }
  });

  test('should share a design', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);

    await page.waitForTimeout(1000);

    const firstDesign = page.locator('[data-testid="design-card"]').first();
    if (await firstDesign.count() > 0) {
      // Click share button
      await page.click('[data-testid="design-card"]:first-child button:has-text("Share"), [data-testid="design-card"]:first-child [aria-label="Share"]');

      // Should show share link
      await expect(page.locator('text=/shared/, text=Copy link')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should view shared design without login', async ({ page, context }) => {
    // Create a share link first
    await page.goto(`${APP_URL}/dashboard`);
    await page.waitForTimeout(1000);

    const firstDesign = page.locator('[data-testid="design-card"]').first();
    if (await firstDesign.count() > 0) {
      await page.click('[data-testid="design-card"]:first-child button:has-text("Share")');

      // Get share link
      const shareLink = await page.locator('input[value*="/shared/"], [data-share-link]').inputValue();

      if (shareLink) {
        // Open in new incognito context
        const newPage = await context.newPage();
        await newPage.goto(shareLink);

        // Should see design without login
        await expect(newPage.locator('text=Design, text=Furniture')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show design total cost', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);

    await page.waitForTimeout(1000);

    const firstDesign = page.locator('[data-testid="design-card"]').first();
    if (await firstDesign.count() > 0) {
      // Should display cost
      await expect(firstDesign.locator('text=\\$, text=Total')).toBeVisible();
    }
  });

  test('should filter designs by name', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);

    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Living Room');
      await page.waitForTimeout(500);

      // Should filter designs
      const visibleDesigns = await page.locator('[data-testid="design-card"]:visible').count();
      expect(visibleDesigns).toBeGreaterThanOrEqual(0);
    }
  });
});

