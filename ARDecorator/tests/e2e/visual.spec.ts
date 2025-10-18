import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('home page visual snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('catalog page visual snapshot', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page).toHaveScreenshot('catalog-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('editor page visual snapshot', async ({ page }) => {
    await page.goto('/editor');
    await expect(page).toHaveScreenshot('editor-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

