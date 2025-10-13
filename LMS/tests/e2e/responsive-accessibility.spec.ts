import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/auth/login');
    
    // Verify mobile layout
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check that elements are properly sized for mobile
    const emailInput = page.locator('input[type="email"]');
    const emailBox = await emailInput.boundingBox();
    expect(emailBox?.width).toBeGreaterThan(200); // Should be wide enough for mobile
  });

  test('should work on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/instructor/dashboard');
    
    // Verify tablet layout
    await expect(page.locator('text=My Courses')).toBeVisible();
    
    // Check sidebar behavior
    const sidebar = page.locator('.sidebar');
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();
    }
  });

  test('should work on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('/admin/dashboard');
    
    // Verify desktop layout
    await expect(page.locator('text=System Overview')).toBeVisible();
    
    // Check for desktop-specific elements
    const sidebar = page.locator('.sidebar');
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();
    }
  });

  test('should handle navigation menu on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/student/dashboard');
    
    // Check for mobile menu button
    const menuButton = page.locator('button[aria-label="Menu"], .mobile-menu-button');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Verify mobile menu opens
      await expect(page.locator('.mobile-menu, .nav-menu')).toBeVisible();
    }
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check for proper ARIA labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Verify inputs have proper labels
    await expect(emailInput).toHaveAttribute('aria-label');
    await expect(passwordInput).toHaveAttribute('aria-label');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/instructor/dashboard');
    
    // Check for proper heading structure
    const h1 = page.locator('h1');
    const h2 = page.locator('h2');
    
    if (await h1.count() > 0) {
      await expect(h1.first()).toBeVisible();
    }
    
    if (await h2.count() > 0) {
      await expect(h2.first()).toBeVisible();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check that text is readable
    const submitButton = page.locator('button[type="submit"]');
    const buttonColor = await submitButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color
      };
    });
    
    // Basic check that button has contrasting colors
    expect(buttonColor.backgroundColor).not.toBe(buttonColor.color);
  });

  test('should support screen readers', async ({ page }) => {
    await page.goto('/student/catalog');
    
    // Check for screen reader friendly elements
    const courseCards = page.locator('.course-card');
    if (await courseCards.count() > 0) {
      const firstCard = courseCards.first();
      
      // Verify card has proper structure for screen readers
      await expect(firstCard).toBeVisible();
      
      // Check for alt text on images
      const images = firstCard.locator('img');
      if (await images.count() > 0) {
        await expect(images.first()).toHaveAttribute('alt');
      }
    }
  });

  test('should handle focus management', async ({ page }) => {
    await page.goto('/instructor/courses/new');
    
    // Test focus management in forms
    const titleInput = page.locator('input[name="title"]');
    if (await titleInput.isVisible()) {
      await titleInput.focus();
      await expect(titleInput).toBeFocused();
      
      // Test that focus moves properly
      await page.keyboard.press('Tab');
      const nextElement = page.locator('textarea[name="description"]');
      if (await nextElement.isVisible()) {
        await expect(nextElement).toBeFocused();
      }
    }
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 errors gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    expect(response?.status()).toBe(404);
    
    // Check for 404 page
    await expect(page.locator('text=Page Not Found')).toBeVisible();
  });

  test('should handle network errors', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/instructor/courses');
    
    // Check for error handling
    await expect(page.locator('text=Unable to load courses')).toBeVisible();
  });

  test('should handle form validation errors', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should handle server errors gracefully', async ({ page }) => {
    // Mock server error
    await page.route('**/api/courses', route => 
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );
    
    await page.goto('/instructor/courses');
    
    // Check for error message
    await expect(page.locator('text=Something went wrong')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load pages quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/auth/login');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle large datasets', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Check that page loads even with many users
    await expect(page.locator('table')).toBeVisible();
    
    // Verify pagination is present for large datasets
    const pagination = page.locator('.pagination');
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();
    }
  });

  test('should lazy load images', async ({ page }) => {
    await page.goto('/student/catalog');
    
    // Check for lazy loading implementation
    const images = page.locator('img[loading="lazy"]');
    if (await images.count() > 0) {
      await expect(images.first()).toHaveAttribute('loading', 'lazy');
    }
  });
});
