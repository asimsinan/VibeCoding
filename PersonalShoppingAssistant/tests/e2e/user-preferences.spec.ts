/**
 * User Preferences E2E Tests
 * TASK-025: User Journey Tests
 * 
 * Tests the user preferences and personalization features
 * including preference management and recommendation updates.
 */

import { test, expect } from '@playwright/test';

test.describe('User Preferences Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'e2e-test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should access user preferences', async ({ page }) => {
    // Click on user profile
    await page.click('[data-testid="user-profile"]');
    
    // Click on preferences
    await page.click('[data-testid="preferences-link"]');
    
    // Should navigate to preferences page
    await expect(page).toHaveURL('/preferences');
    
    // Should show preferences form
    await expect(page.locator('[data-testid="preferences-form"]')).toBeVisible();
  });

  test('should update style preferences', async ({ page }) => {
    // Navigate to preferences
    await page.goto('/preferences');
    
    // Wait for preferences form
    await expect(page.locator('[data-testid="preferences-form"]')).toBeVisible();
    
    // Update style preferences
    await page.check('[data-testid="style-casual"]');
    await page.check('[data-testid="style-formal"]');
    await page.uncheck('[data-testid="style-sporty"]');
    
    // Update color preferences
    await page.selectOption('[data-testid="primary-color-select"]', 'blue');
    await page.selectOption('[data-testid="secondary-color-select"]', 'gray');
    
    // Save preferences
    await page.click('[data-testid="save-preferences-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Preferences updated');
    
    // Should persist changes
    await page.reload();
    await expect(page.locator('[data-testid="style-casual"]')).toBeChecked();
    await expect(page.locator('[data-testid="style-formal"]')).toBeChecked();
    await expect(page.locator('[data-testid="style-sporty"]')).not.toBeChecked();
  });

  test('should update category preferences', async ({ page }) => {
    // Navigate to preferences
    await page.goto('/preferences');
    
    // Update category preferences
    await page.check('[data-testid="category-electronics"]');
    await page.check('[data-testid="category-clothing"]');
    await page.uncheck('[data-testid="category-books"]');
    
    // Update brand preferences
    await page.fill('[data-testid="preferred-brands-input"]', 'Apple, Samsung, Nike');
    
    // Save preferences
    await page.click('[data-testid="save-preferences-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Preferences updated');
  });

  test('should update price range preferences', async ({ page }) => {
    // Navigate to preferences
    await page.goto('/preferences');
    
    // Update price range
    await page.fill('[data-testid="min-price-input"]', '50');
    await page.fill('[data-testid="max-price-input"]', '1000');
    
    // Update rating preferences
    await page.fill('[data-testid="min-rating-input"]', '4.0');
    
    // Save preferences
    await page.click('[data-testid="save-preferences-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Preferences updated');
  });

  test('should update excluded categories and brands', async ({ page }) => {
    // Navigate to preferences
    await page.goto('/preferences');
    
    // Update excluded categories
    await page.check('[data-testid="exclude-category-books"]');
    await page.check('[data-testid="exclude-category-home"]');
    
    // Update excluded brands
    await page.fill('[data-testid="excluded-brands-input"]', 'BrandX, BrandY');
    
    // Save preferences
    await page.click('[data-testid="save-preferences-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Preferences updated');
  });

  test('should reset preferences to default', async ({ page }) => {
    // Navigate to preferences
    await page.goto('/preferences');
    
    // Make some changes
    await page.check('[data-testid="style-casual"]');
    await page.fill('[data-testid="min-price-input"]', '100');
    
    // Reset to default
    await page.click('[data-testid="reset-preferences-button"]');
    
    // Confirm reset
    await page.click('[data-testid="confirm-reset-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Preferences reset to default');
    
    // Should have default values
    await expect(page.locator('[data-testid="style-casual"]')).not.toBeChecked();
    await expect(page.locator('[data-testid="min-price-input"]')).toHaveValue('0');
  });

  test('should validate preference inputs', async ({ page }) => {
    // Navigate to preferences
    await page.goto('/preferences');
    
    // Test invalid price range
    await page.fill('[data-testid="min-price-input"]', '1000');
    await page.fill('[data-testid="max-price-input"]', '500');
    
    // Try to save
    await page.click('[data-testid="save-preferences-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="price-range-error"]')).toContainText('Minimum price must be less than maximum price');
    
    // Test invalid rating
    await page.fill('[data-testid="min-price-input"]', '100');
    await page.fill('[data-testid="max-price-input"]', '500');
    await page.fill('[data-testid="min-rating-input"]', '6.0');
    
    // Try to save
    await page.click('[data-testid="save-preferences-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="rating-error"]')).toContainText('Rating must be between 0 and 5');
  });

  test('should update recommendations based on preferences', async ({ page }) => {
    // Navigate to preferences
    await page.goto('/preferences');
    
    // Update preferences
    await page.check('[data-testid="style-casual"]');
    await page.check('[data-testid="category-electronics"]');
    await page.fill('[data-testid="min-price-input"]', '200');
    await page.fill('[data-testid="max-price-input"]', '800');
    
    // Save preferences
    await page.click('[data-testid="save-preferences-button"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Preferences updated');
    
    // Go back to dashboard
    await page.click('[data-testid="back-to-dashboard-button"]');
    
    // Should show updated recommendations
    await expect(page.locator('[data-testid="recommendations-section"]')).toBeVisible();
    
    // Recommendations should reflect new preferences
    const recommendations = page.locator('[data-testid="recommendation-card"]');
    await expect(recommendations).toHaveCount.greaterThan(0);
  });

  test('should show preference-based filtering', async ({ page }) => {
    // Navigate to preferences
    await page.goto('/preferences');
    
    // Set specific preferences
    await page.check('[data-testid="category-clothing"]');
    await page.fill('[data-testid="min-price-input"]', '50');
    await page.fill('[data-testid="max-price-input"]', '200');
    
    // Save preferences
    await page.click('[data-testid="save-preferences-button"]');
    
    // Go back to dashboard
    await page.click('[data-testid="back-to-dashboard-button"]');
    
    // Products should be filtered based on preferences
    const products = page.locator('[data-testid="product-card"]');
    await expect(products).toHaveCount.greaterThan(0);
    
    // Check that products match preferences (simplified check)
    const firstProduct = products.first();
    await expect(firstProduct).toBeVisible();
  });

  test('should handle preference loading errors', async ({ page }) => {
    // Mock API error for preferences
    await page.route('**/api/preferences**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Navigate to preferences
    await page.goto('/preferences');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load preferences');
    
    // Should show retry button
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should handle preference save errors', async ({ page }) => {
    // Navigate to preferences
    await page.goto('/preferences');
    
    // Wait for form to load
    await expect(page.locator('[data-testid="preferences-form"]')).toBeVisible();
    
    // Mock API error for saving
    await page.route('**/api/preferences**', route => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to save preferences' })
        });
      } else {
        route.continue();
      }
    });
    
    // Make a change
    await page.check('[data-testid="style-casual"]');
    
    // Try to save
    await page.click('[data-testid="save-preferences-button"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to save preferences');
  });
});
