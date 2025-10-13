import { test as base } from '@playwright/test';

// Extend the base test with custom fixtures
export const test = base.extend({
  // Custom fixture for authenticated pages
  authenticatedPage: async ({ page }, use) => {
    // Mock authentication for testing
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for authentication to complete
    await page.waitForURL('/**/dashboard');
    
    await use(page);
  },

  // Custom fixture for admin pages
  adminPage: async ({ page }, use) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/admin/dashboard');
    
    await use(page);
  },

  // Custom fixture for instructor pages
  instructorPage: async ({ page }, use) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'instructor@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/instructor/dashboard');
    
    await use(page);
  },

  // Custom fixture for student pages
  studentPage: async ({ page }, use) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'student@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/student/dashboard');
    
    await use(page);
  },
});

export { expect } from '@playwright/test';
