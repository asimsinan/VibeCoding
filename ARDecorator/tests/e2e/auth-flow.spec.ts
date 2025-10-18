import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3001/api/v1';
const APP_URL = 'http://localhost:3000';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto(APP_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('should register a new user successfully', async ({ page }) => {
    await page.goto(`${APP_URL}/register`);

    // Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL(`${APP_URL}/dashboard`, { timeout: 5000 });

    // Should have auth token in localStorage
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeTruthy();
  });

  test('should login existing user successfully', async ({ page }) => {
    await page.goto(`${APP_URL}/login`);

    // Use the seeded test user
    await page.fill('input[name="email"]', 'user@ardecorator.com');
    await page.fill('input[name="password"]', 'user123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(`${APP_URL}/dashboard`, { timeout: 5000 });

    // Should have auth token
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeTruthy();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto(`${APP_URL}/login`);

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 3000 });

    // Should still be on login page
    await expect(page).toHaveURL(`${APP_URL}/login`);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[name="email"]', 'user@ardecorator.com');
    await page.fill('input[name="password"]', 'user123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL(`${APP_URL}/dashboard`);

    // Click logout button
    await page.click('button:has-text("Logout"), a:has-text("Logout")');

    // Should clear token
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();

    // Should redirect to home or login
    await page.waitForURL(/\/(login|)$/, { timeout: 3000 });
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto(`${APP_URL}/dashboard`);

    // Should redirect to login
    await expect(page).toHaveURL(`${APP_URL}/login`);
  });

  test('should allow access to authenticated routes after login', async ({ page }) => {
    // Login
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[name="email"]', 'user@ardecorator.com');
    await page.fill('input[name="password"]', 'user123');
    await page.click('button[type="submit"]');

    // Navigate to protected routes
    await page.goto(`${APP_URL}/dashboard`);
    await expect(page).toHaveURL(`${APP_URL}/dashboard`);

    await page.goto(`${APP_URL}/editor`);
    await expect(page).toHaveURL(`${APP_URL}/editor`);
  });

  test('should protect admin routes from regular users', async ({ page }) => {
    // Login as regular user
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[name="email"]', 'user@ardecorator.com');
    await page.fill('input[name="password"]', 'user123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${APP_URL}/dashboard`);

    // Try to access admin page
    await page.goto(`${APP_URL}/admin`);

    // Should redirect to home
    await expect(page).toHaveURL(`${APP_URL}/`);
  });

  test('should allow admin access for admin users', async ({ page }) => {
    // Login as admin
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[name="email"]', 'admin@ardecorator.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${APP_URL}/dashboard`);

    // Access admin page
    await page.goto(`${APP_URL}/admin`);
    await expect(page).toHaveURL(`${APP_URL}/admin`);
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    // Login
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[name="email"]', 'user@ardecorator.com');
    await page.fill('input[name="password"]', 'user123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${APP_URL}/dashboard`);

    // Reload page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL(`${APP_URL}/dashboard`);

    // Token should still be present
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeTruthy();
  });
});

