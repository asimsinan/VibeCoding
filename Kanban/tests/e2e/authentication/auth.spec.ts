/**
 * E2E Tests: Authentication
 * Tests authentication flows, login/logout, and session management
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from '../setup/test-helpers';
import { TEST_USERS, TEST_URLS, SELECTORS } from '../setup/test-data';

test.describe('Authentication', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Login Flow', () => {
    test('should login with valid credentials', async ({ page }) => {
      const user = TEST_USERS.admin;

      await helpers.navigateTo(TEST_URLS.login);
      await helpers.fillField(SELECTORS.emailInput, user.email);
      await helpers.fillField(SELECTORS.passwordInput, user.password);
      await helpers.page.click(SELECTORS.loginButton);

      await helpers.waitForLoadingToComplete();
      await helpers.expectToBeLoggedIn();
      await helpers.expectToBeOnPage(TEST_URLS.dashboard);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);
      await helpers.fillField(SELECTORS.emailInput, 'invalid@example.com');
      await helpers.fillField(SELECTORS.passwordInput, 'wrongpassword');
      await helpers.page.click(SELECTORS.loginButton);

      await helpers.expectErrorMessage('Invalid email or password');
    });

    test('should show error for empty email', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);
      await helpers.fillField(SELECTORS.passwordInput, TEST_USERS.admin.password);
      await helpers.page.click(SELECTORS.loginButton);

      await helpers.expectFieldError(SELECTORS.emailInput, 'Email is required');
    });

    test('should show error for empty password', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);
      await helpers.fillField(SELECTORS.emailInput, TEST_USERS.admin.email);
      await helpers.page.click(SELECTORS.loginButton);

      await helpers.expectFieldError(SELECTORS.passwordInput, 'Password is required');
    });

    test('should show error for invalid email format', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);
      await helpers.fillField(SELECTORS.emailInput, 'invalid-email');
      await helpers.fillField(SELECTORS.passwordInput, TEST_USERS.admin.password);
      await helpers.page.click(SELECTORS.loginButton);

      await helpers.expectFieldError(SELECTORS.emailInput, 'Please enter a valid email address');
    });

    test('should show error for short password', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);
      await helpers.fillField(SELECTORS.emailInput, TEST_USERS.admin.email);
      await helpers.fillField(SELECTORS.passwordInput, '123');
      await helpers.page.click(SELECTORS.loginButton);

      await helpers.expectFieldError(SELECTORS.passwordInput, 'Password must be at least 6 characters');
    });
  });

  test.describe('Signup Flow', () => {
    test('should signup with valid credentials', async ({ page }) => {
      const user = TEST_USERS.admin;

      await helpers.navigateTo(TEST_URLS.signup);
      await helpers.fillField(SELECTORS.emailInput, user.email);
      await helpers.fillField(SELECTORS.passwordInput, user.password);
      await helpers.page.click(SELECTORS.signupButton);

      await helpers.waitForLoadingToComplete();
      await helpers.expectToBeLoggedIn();
      await helpers.expectToBeOnPage(TEST_URLS.dashboard);
    });

    test('should show error for existing email', async ({ page }) => {
      // First, create a user
      await helpers.signup(TEST_USERS.admin);

      // Try to signup with same email
      await helpers.navigateTo(TEST_URLS.signup);
      await helpers.fillField(SELECTORS.emailInput, TEST_USERS.admin.email);
      await helpers.fillField(SELECTORS.passwordInput, TEST_USERS.admin.password);
      await helpers.page.click(SELECTORS.signupButton);

      await helpers.expectErrorMessage('Email already exists');
    });

    test('should show error for password mismatch', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.signup);
      await helpers.fillField(SELECTORS.emailInput, TEST_USERS.admin.email);
      await helpers.fillField(SELECTORS.passwordInput, TEST_USERS.admin.password);
      await helpers.fillField('[data-testid="confirm-password-input"]', 'different-password');
      await helpers.page.click(SELECTORS.signupButton);

      await helpers.expectErrorMessage('Passwords do not match');
    });

    test('should validate password strength', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.signup);
      await helpers.fillField(SELECTORS.emailInput, TEST_USERS.admin.email);
      await helpers.fillField(SELECTORS.passwordInput, 'weak');
      await helpers.page.click(SELECTORS.signupButton);

      await helpers.expectFieldError(SELECTORS.passwordInput, 'Password must contain at least 8 characters, including uppercase, lowercase, and number');
    });
  });

  test.describe('Logout Flow', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.login(TEST_USERS.admin);
    });

    test('should logout successfully', async ({ page }) => {
      await helpers.logout();
      await helpers.expectToBeLoggedOut();
      await helpers.expectToBeOnPage(TEST_URLS.login);
    });

    test('should clear session data on logout', async ({ page }) => {
      // Verify user is logged in
      await helpers.expectToBeLoggedIn();

      // Logout
      await helpers.logout();

      // Try to access protected page
      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.expectToBeOnPage(TEST_URLS.login);
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      await helpers.login(TEST_USERS.admin);
      await helpers.expectToBeLoggedIn();

      // Refresh page
      await helpers.page.reload();
      await helpers.waitForLoadingToComplete();

      // Should still be logged in
      await helpers.expectToBeLoggedIn();
    });

    test('should maintain session across browser tabs', async ({ page, context }) => {
      await helpers.login(TEST_USERS.admin);
      await helpers.expectToBeLoggedIn();

      // Open new tab
      const newPage = await context.newPage();
      const newHelpers = new TestHelpers(newPage);

      // Navigate to protected page in new tab
      await newHelpers.navigateTo(TEST_URLS.workspaces);
      await newHelpers.expectToBeLoggedIn();

      await newPage.close();
    });

    test('should handle session expiration', async ({ page }) => {
      await helpers.login(TEST_USERS.admin);
      await helpers.expectToBeLoggedIn();

      // Simulate session expiration by clearing localStorage
      await helpers.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Try to access protected page
      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.expectToBeOnPage(TEST_URLS.login);
    });

    test('should refresh token automatically', async ({ page }) => {
      await helpers.login(TEST_USERS.admin);
      await helpers.expectToBeLoggedIn();

      // Wait for token refresh (this would need proper implementation)
      await helpers.page.waitForTimeout(1000);

      // Should still be logged in after token refresh
      await helpers.expectToBeLoggedIn();
    });
  });

  test.describe('Social Login', () => {
    test('should login with Google', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);
      await helpers.page.click('[data-testid="google-login-button"]');

      // Mock Google OAuth flow
      await helpers.page.route('**/auth/google**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'google-user-id',
              email: 'user@gmail.com',
              name: 'Google User'
            },
            access_token: 'mock-access-token'
          })
        });
      });

      await helpers.waitForLoadingToComplete();
      await helpers.expectToBeLoggedIn();
    });

    test('should login with GitHub', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);
      await helpers.page.click('[data-testid="github-login-button"]');

      // Mock GitHub OAuth flow
      await helpers.page.route('**/auth/github**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'github-user-id',
              email: 'user@github.com',
              name: 'GitHub User'
            },
            access_token: 'mock-access-token'
          })
        });
      });

      await helpers.waitForLoadingToComplete();
      await helpers.expectToBeLoggedIn();
    });

    test('should handle social login errors', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);
      await helpers.page.click('[data-testid="google-login-button"]');

      // Mock Google OAuth error
      await helpers.page.route('**/auth/google**', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'OAuth authentication failed'
          })
        });
      });

      await helpers.expectErrorMessage('Authentication failed');
    });
  });

  test.describe('Password Reset', () => {
    test('should request password reset', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);
      await helpers.page.click('[data-testid="forgot-password-link"]');

      await helpers.fillField('[data-testid="reset-email-input"]', TEST_USERS.admin.email);
      await helpers.page.click('[data-testid="reset-password-button"]');

      await helpers.expectSuccessMessage('Password reset email sent');
    });

    test('should show error for non-existent email', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);
      await helpers.page.click('[data-testid="forgot-password-link"]');

      await helpers.fillField('[data-testid="reset-email-input"]', 'nonexistent@example.com');
      await helpers.page.click('[data-testid="reset-password-button"]');

      await helpers.expectErrorMessage('Email not found');
    });

    test('should reset password with valid token', async ({ page }) => {
      const resetToken = 'valid-reset-token';
      await helpers.navigateTo(`/auth/reset-password?token=${resetToken}`);

      await helpers.fillField('[data-testid="new-password-input"]', 'NewPassword123!');
      await helpers.fillField('[data-testid="confirm-password-input"]', 'NewPassword123!');
      await helpers.page.click('[data-testid="reset-password-button"]');

      await helpers.expectSuccessMessage('Password reset successfully');
      await helpers.expectToBeOnPage(TEST_URLS.login);
    });

    test('should show error for invalid reset token', async ({ page }) => {
      const invalidToken = 'invalid-reset-token';
      await helpers.navigateTo(`/auth/reset-password?token=${invalidToken}`);

      await helpers.fillField('[data-testid="new-password-input"]', 'NewPassword123!');
      await helpers.fillField('[data-testid="confirm-password-input"]', 'NewPassword123!');
      await helpers.page.click('[data-testid="reset-password-button"]');

      await helpers.expectErrorMessage('Invalid or expired reset token');
    });
  });

  test.describe('Form Validation', () => {
    test('should validate email format in real-time', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);
      
      await helpers.fillField(SELECTORS.emailInput, 'invalid-email');
      await helpers.page.blur(SELECTORS.emailInput);

      await helpers.expectFieldError(SELECTORS.emailInput, 'Please enter a valid email address');
    });

    test('should validate password strength in real-time', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.signup);
      
      await helpers.fillField(SELECTORS.passwordInput, 'weak');
      await helpers.page.blur(SELECTORS.passwordInput);

      await helpers.expectFieldError(SELECTORS.passwordInput, 'Password must contain at least 8 characters, including uppercase, lowercase, and number');
    });

    test('should clear validation errors when user corrects input', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);
      
      // Enter invalid email
      await helpers.fillField(SELECTORS.emailInput, 'invalid-email');
      await helpers.page.blur(SELECTORS.emailInput);
      await helpers.expectFieldError(SELECTORS.emailInput, 'Please enter a valid email address');

      // Correct the email
      await helpers.fillField(SELECTORS.emailInput, TEST_USERS.admin.email);
      await helpers.page.blur(SELECTORS.emailInput);

      // Error should be cleared
      const errorElement = helpers.page.locator(`${SELECTORS.emailInput} + [data-testid="field-error"]`);
      await expect(errorElement).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);

      // Tab through form elements
      await helpers.page.keyboard.press('Tab'); // Email input
      await helpers.page.keyboard.press('Tab'); // Password input
      await helpers.page.keyboard.press('Tab'); // Login button

      // Should be able to submit with Enter
      await helpers.page.keyboard.press('Enter');
      await helpers.waitForLoadingToComplete();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);

      const emailInput = helpers.page.locator(SELECTORS.emailInput);
      await expect(emailInput).toHaveAttribute('aria-label', 'Email address');

      const passwordInput = helpers.page.locator(SELECTORS.passwordInput);
      await expect(passwordInput).toHaveAttribute('aria-label', 'Password');
    });

    test('should announce errors to screen readers', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.login);
      await helpers.page.click(SELECTORS.loginButton);

      const errorMessage = helpers.page.locator(SELECTORS.errorMessage);
      await expect(errorMessage).toHaveAttribute('role', 'alert');
      await expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });
  });
});
