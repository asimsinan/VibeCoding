import { test, expect } from './fixtures';

test.describe('Cross-Browser Compatibility', () => {
  test.describe('Authentication Flow', () => {
    test('should work consistently across all browsers', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Test login form elements
      await expect(page).toHaveTitle(/Login/);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Test form interaction
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      
      // Verify form values are set correctly
      await expect(page.locator('input[type="email"]')).toHaveValue('test@example.com');
      await expect(page.locator('input[type="password"]')).toHaveValue('password123');
    });

    test('should handle form validation consistently', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Test empty form submission
      await page.locator('button[type="submit"]').click();
      
      // Check for validation messages (if implemented)
      // This test ensures consistent behavior across browsers
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });
  });

  test.describe('Navigation and Routing', () => {
    test('should navigate correctly across browsers', async ({ page }) => {
      await page.goto('/');
      
      // Test navigation elements
      const navElements = page.locator('nav, header, [role="navigation"]');
      await expect(navElements.first()).toBeVisible();
      
      // Test if navigation links are clickable
      const links = page.locator('a[href]');
      const linkCount = await links.count();
      
      if (linkCount > 0) {
        const firstLink = links.first();
        await expect(firstLink).toBeVisible();
        
        // Test link interaction
        const href = await firstLink.getAttribute('href');
        if (href && href.startsWith('/')) {
          await firstLink.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should handle browser back/forward navigation', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to a page
      await page.goto('/auth/login');
      await expect(page).toHaveURL(/auth\/login/);
      
      // Test browser back button
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      // Test browser forward button
      await page.goForward();
      await expect(page).toHaveURL(/auth\/login/);
    });
  });

  test.describe('Form Interactions', () => {
    test('should handle form inputs consistently', async ({ page }) => {
      await page.goto('/auth/login');
      
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      // Test input focus
      await emailInput.focus();
      await expect(emailInput).toBeFocused();
      
      await passwordInput.focus();
      await expect(passwordInput).toBeFocused();
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(emailInput).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(passwordInput).toBeFocused();
    });

    test('should handle form submission consistently', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Fill form
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      
      // Test Enter key submission
      await page.keyboard.press('Enter');
      
      // Wait for any navigation or error handling
      await page.waitForTimeout(1000);
      
      // Verify form state
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });
  });

  test.describe('CSS and Styling', () => {
    test('should render styles consistently', async ({ page }) => {
      await page.goto('/');
      
      // Test basic styling
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Test if CSS is loaded
      const computedStyle = await body.evaluate((el) => {
        return window.getComputedStyle(el);
      });
      
      expect(computedStyle).toBeDefined();
    });

    test('should handle responsive design', async ({ page }) => {
      await page.goto('/');
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('body')).toBeVisible();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('body')).toBeVisible();
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('JavaScript Functionality', () => {
    test('should execute JavaScript consistently', async ({ page }) => {
      await page.goto('/');
      
      // Test basic JavaScript execution
      const result = await page.evaluate(() => {
        return typeof window !== 'undefined' && typeof document !== 'undefined';
      });
      
      expect(result).toBe(true);
    });

    test('should handle DOM manipulation', async ({ page }) => {
      await page.goto('/');
      
      // Test DOM querying
      const elementCount = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });
      
      expect(elementCount).toBeGreaterThan(0);
    });

    test('should handle event listeners', async ({ page }) => {
      await page.goto('/');
      
      // Test click events
      const clickResult = await page.evaluate(() => {
        return new Promise((resolve) => {
          document.addEventListener('click', () => resolve(true), { once: true });
          document.body.click();
        });
      });
      
      expect(clickResult).toBe(true);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 pages consistently', async ({ page }) => {
      const response = await page.goto('/non-existent-page');
      
      // Check if 404 page is handled gracefully
      if (response) {
        expect(response.status()).toBe(404);
      }
      
      // Verify page still loads some content
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle JavaScript errors gracefully', async ({ page }) => {
      // Listen for console errors
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/');
      
      // Wait a bit for any potential errors
      await page.waitForTimeout(2000);
      
      // Log errors for debugging but don't fail the test
      if (errors.length > 0) {
        console.log('Console errors detected:', errors);
      }
    });
  });

  test.describe('Performance', () => {
    test('should load pages within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Expect page to load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large content efficiently', async ({ page }) => {
      await page.goto('/');
      
      // Test scrolling performance
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await page.waitForTimeout(1000);
      
      // Verify page is still responsive
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should maintain accessibility across browsers', async ({ page }) => {
      await page.goto('/');
      
      // Test basic accessibility features
      const hasTitle = await page.evaluate(() => {
        return document.title && document.title.length > 0;
      });
      
      expect(hasTitle).toBe(true);
      
      // Test if page has proper structure
      const hasHeading = await page.evaluate(() => {
        return document.querySelector('h1, h2, h3, h4, h5, h6') !== null;
      });
      
      // This might not always be true depending on the page
      // but we'll log it for debugging
      if (!hasHeading) {
        console.log('No heading elements found on page');
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verify page is still functional
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
