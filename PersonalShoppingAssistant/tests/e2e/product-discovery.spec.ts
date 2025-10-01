/**
 * Product Discovery E2E Tests
 * TASK-025: User Journey Tests
 * 
 * Tests the complete product discovery and recommendation flow
 * including search, filtering, product details, and recommendations.
 */

import { test, expect } from '@playwright/test';

test.describe('Product Discovery Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'e2e-test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display product list on dashboard', async ({ page }) => {
    // Should show product grid
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
    
    // Should show at least one product
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount.greaterThan(0);
    
    // Should show product information
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="product-image"]')).toBeVisible();
  });

  test('should allow product search', async ({ page }) => {
    // Click on search input
    await page.click('[data-testid="search-input"]');
    
    // Type search query
    await page.fill('[data-testid="search-input"]', 'laptop');
    
    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"]');
    
    // Should show search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // Should show products matching search
    const searchResults = page.locator('[data-testid="product-card"]');
    await expect(searchResults).toHaveCount.greaterThan(0);
    
    // Clear search
    await page.fill('[data-testid="search-input"]', '');
    
    // Should show all products again
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
  });

  test('should allow product filtering', async ({ page }) => {
    // Open filters
    await page.click('[data-testid="filter-button"]');
    
    // Wait for filter panel
    await expect(page.locator('[data-testid="filter-panel"]')).toBeVisible();
    
    // Apply category filter
    await page.click('[data-testid="category-filter"]');
    await page.click('[data-testid="category-electronics"]');
    
    // Apply price range filter
    await page.fill('[data-testid="min-price-input"]', '100');
    await page.fill('[data-testid="max-price-input"]', '500');
    
    // Apply filters
    await page.click('[data-testid="apply-filters-button"]');
    
    // Should show filtered results
    await expect(page.locator('[data-testid="filtered-results"]')).toBeVisible();
    
    // Clear filters
    await page.click('[data-testid="clear-filters-button"]');
    
    // Should show all products again
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
  });

  test('should display product details', async ({ page }) => {
    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    
    // Should navigate to product details page
    await expect(page).toHaveURL(/\/products\/\d+/);
    
    // Should show product details
    await expect(page.locator('[data-testid="product-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-rating"]')).toBeVisible();
    
    // Should show action buttons
    await expect(page.locator('[data-testid="like-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="dislike-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-to-favorites-button"]')).toBeVisible();
  });

  test('should allow product interactions', async ({ page }) => {
    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    
    // Wait for product details
    await expect(page.locator('[data-testid="product-details"]')).toBeVisible();
    
    // Like the product
    await page.click('[data-testid="like-button"]');
    
    // Should show liked state
    await expect(page.locator('[data-testid="like-button"]')).toHaveClass(/liked/);
    
    // Dislike the product
    await page.click('[data-testid="dislike-button"]');
    
    // Should show disliked state
    await expect(page.locator('[data-testid="dislike-button"]')).toHaveClass(/disliked/);
    
    // Add to favorites
    await page.click('[data-testid="add-to-favorites-button"]');
    
    // Should show added to favorites
    await expect(page.locator('[data-testid="add-to-favorites-button"]')).toHaveClass(/favorited/);
  });

  test('should display recommendations', async ({ page }) => {
    // Should show recommendations section
    await expect(page.locator('[data-testid="recommendations-section"]')).toBeVisible();
    
    // Should show recommendation cards
    await expect(page.locator('[data-testid="recommendation-card"]')).toHaveCount.greaterThan(0);
    
    // Should show recommendation reason
    const firstRecommendation = page.locator('[data-testid="recommendation-card"]').first();
    await expect(firstRecommendation.locator('[data-testid="recommendation-reason"]')).toBeVisible();
    
    // Should show recommendation score
    await expect(firstRecommendation.locator('[data-testid="recommendation-score"]')).toBeVisible();
  });

  test('should allow recommendation interaction', async ({ page }) => {
    // Wait for recommendations to load
    await expect(page.locator('[data-testid="recommendations-section"]')).toBeVisible();
    
    // Click on first recommendation
    const firstRecommendation = page.locator('[data-testid="recommendation-card"]').first();
    await firstRecommendation.click();
    
    // Should navigate to product details
    await expect(page).toHaveURL(/\/products\/\d+/);
    
    // Go back to dashboard
    await page.goBack();
    
    // Should be back on dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle pagination', async ({ page }) => {
    // Should show pagination controls
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    
    // Click next page
    await page.click('[data-testid="next-page-button"]');
    
    // Should show different products
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
    
    // Click previous page
    await page.click('[data-testid="previous-page-button"]');
    
    // Should show original products
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    // Trigger a search
    await page.fill('[data-testid="search-input"]', 'test search');
    
    // Should show loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]');
    
    // Should hide loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
  });

  test('should handle error states', async ({ page }) => {
    // Mock API error
    await page.route('**/api/products**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Trigger a search
    await page.fill('[data-testid="search-input"]', 'test search');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Something went wrong');
    
    // Should show retry button
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });
});
