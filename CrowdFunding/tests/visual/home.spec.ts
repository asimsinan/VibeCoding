import { test, expect } from '@playwright/test';

test.describe('Home Page Visual Tests', () => {
  test('should match home page screenshot', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Take a full page screenshot
    await expect(page).toHaveScreenshot('home-page.png');
  });

  test('should match home page hero section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of just the hero section
    const heroSection = page.locator('section').first();
    await expect(heroSection).toHaveScreenshot('home-hero-section.png');
  });

  test('should match home page stats section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of the stats section
    const statsSection = page.locator('section').nth(1);
    await expect(statsSection).toHaveScreenshot('home-stats-section.png');
  });
});

test.describe('Campaigns Page Visual Tests', () => {
  test('should match campaigns page screenshot', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('campaigns-page.png');
  });

  test('should match campaign card component', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of a campaign card if it exists
    const campaignCard = page.locator('[data-testid="campaign-card"]').first();
    if (await campaignCard.count() > 0) {
      await expect(campaignCard).toHaveScreenshot('campaign-card.png');
    }
  });
});

test.describe('Authentication Pages Visual Tests', () => {
  test('should match login page screenshot', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('should match register page screenshot', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('register-page.png');
  });
});

test.describe('Responsive Design Tests', () => {
  test('should match mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('home-page-mobile.png');
  });

  test('should match tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('home-page-tablet.png');
  });
});

test.describe('Component Visual Tests', () => {
  test('should match button component states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test primary button
    const primaryButton = page.locator('button').first();
    await expect(primaryButton).toHaveScreenshot('button-primary.png');
    
    // Test button hover state
    await primaryButton.hover();
    await expect(primaryButton).toHaveScreenshot('button-primary-hover.png');
  });

  test('should match card component', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');
    
    const card = page.locator('[data-testid="card"]').first();
    if (await card.count() > 0) {
      await expect(card).toHaveScreenshot('card-component.png');
    }
  });
});
