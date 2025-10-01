/**
 * Authentication E2E Tests
 * TASK-024: End-to-End Test Setup
 * 
 * Tests the complete authentication flow including registration,
 * login, logout, and session management.
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should allow user registration', async ({ page }) => {
    // Click on register link
    await page.click('[data-testid="register-link"]');
    
    // Wait for registration form
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', 'newuser@example.com');
    await page.fill('[data-testid="password-input"]', 'securepassword123');
    await page.fill('[data-testid="name-input"]', 'New User');
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Registration successful');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should allow user login', async ({ page }) => {
    // Click on login link
    await page.click('[data-testid="login-link"]');
    
    // Wait for login form
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', 'e2e-test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    
    // Submit login
    await page.click('[data-testid="login-button"]');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show user profile
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('should handle invalid login credentials', async ({ page }) => {
    // Click on login link
    await page.click('[data-testid="login-link"]');
    
    // Fill login form with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    
    // Submit login
    await page.click('[data-testid="login-button"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    
    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('should allow user logout', async ({ page }) => {
    // Login first
    await page.click('[data-testid="login-link"]');
    await page.fill('[data-testid="email-input"]', 'e2e-test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Click logout
    await page.click('[data-testid="logout-button"]');
    
    // Should be redirected to home page
    await expect(page).toHaveURL('/');
    
    // Should show login link
    await expect(page.locator('[data-testid="login-link"]')).toBeVisible();
  });

  test('should persist session across page refreshes', async ({ page }) => {
    // Login first
    await page.click('[data-testid="login-link"]');
    await page.fill('[data-testid="email-input"]', 'e2e-test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    // Test registration form validation
    await page.click('[data-testid="register-link"]');
    
    // Try to submit empty form
    await page.click('[data-testid="register-button"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    
    // Test invalid email format
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.click('[data-testid="register-button"]');
    
    // Should show email format error
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
    
    // Test password length validation
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', '123');
    await page.click('[data-testid="register-button"]');
    
    // Should show password length error
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password must be at least 8 characters');
  });
});
