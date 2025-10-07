/**
 * E2E Tests: Workspace Management
 * Tests workspace creation, deletion, member management, and role-based access control
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from '../setup/test-helpers';
import { TEST_USERS, TEST_WORKSPACES, TEST_URLS, SELECTORS } from '../setup/test-data';

test.describe('Workspace Management', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(TEST_USERS.admin);
  });

  test.describe('Workspace Creation', () => {
    test('should create workspace with valid data', async ({ page }) => {
      const workspace = TEST_WORKSPACES.primary;

      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.createWorkspace(workspace);
      await helpers.expectWorkspaceToExist(workspace.name);
      await helpers.expectSuccessMessage('Workspace created successfully');
    });

    test('should validate required fields', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.page.click(SELECTORS.createWorkspaceButton);
      await helpers.page.click(SELECTORS.workspaceSubmitButton);

      await helpers.expectFieldError(SELECTORS.workspaceNameInput, 'Name is required');
    });

    test('should validate field lengths', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.page.click(SELECTORS.createWorkspaceButton);

      // Test name too long
      await helpers.fillField(SELECTORS.workspaceNameInput, 'a'.repeat(101));
      await helpers.page.click(SELECTORS.workspaceSubmitButton);

      await helpers.expectFieldError(SELECTORS.workspaceNameInput, 'Name must be less than 100 characters');

      // Test description too long
      await helpers.fillField(SELECTORS.workspaceNameInput, 'Valid Name');
      await helpers.fillField(SELECTORS.workspaceDescriptionInput, 'a'.repeat(501));
      await helpers.page.click(SELECTORS.workspaceSubmitButton);

      await helpers.expectFieldError(SELECTORS.workspaceDescriptionInput, 'Description must be less than 500 characters');
    });

    test('should prevent duplicate workspace names', async ({ page }) => {
      const workspace = TEST_WORKSPACES.primary;

      // Create first workspace
      await helpers.createWorkspace(workspace);

      // Try to create workspace with same name
      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.page.click(SELECTORS.createWorkspaceButton);
      await helpers.fillField(SELECTORS.workspaceNameInput, workspace.name);
      await helpers.fillField(SELECTORS.workspaceDescriptionInput, 'Different description');
      await helpers.page.click(SELECTORS.workspaceSubmitButton);

      await helpers.expectErrorMessage('Workspace name already exists');
    });

    test('should create workspace with default settings', async ({ page }) => {
      const workspace = TEST_WORKSPACES.primary;

      await helpers.createWorkspace(workspace);
      await helpers.expectWorkspaceToExist(workspace.name);

      // Verify workspace has default settings
      const workspaceCards = await helpers.getWorkspaceCards();
      const workspaceCard = workspaceCards.find(card => card.includes(workspace.name));
      expect(workspaceCard).toContain('Admin'); // Default role
    });
  });

  test.describe('Workspace List and Display', () => {
    test('should display user workspaces', async ({ page }) => {
      // Create multiple workspaces
      await helpers.createWorkspace(TEST_WORKSPACES.primary);
      await helpers.createWorkspace(TEST_WORKSPACES.secondary);

      await helpers.navigateTo(TEST_URLS.workspaces);
      const workspaceCards = await helpers.getWorkspaceCards();

      expect(workspaceCards.length).toBeGreaterThanOrEqual(2);
      expect(workspaceCards.some(card => card.includes(TEST_WORKSPACES.primary.name))).toBe(true);
      expect(workspaceCards.some(card => card.includes(TEST_WORKSPACES.secondary.name))).toBe(true);
    });

    test('should show workspace statistics', async ({ page }) => {
      const workspace = TEST_WORKSPACES.primary;

      await helpers.createWorkspace(workspace);
      await helpers.navigateTo(TEST_URLS.workspaces);

      const workspaceCards = await helpers.getWorkspaceCards();
      const workspaceCard = workspaceCards.find(card => card.includes(workspace.name));
      
      // Should show member count and board count
      expect(workspaceCard).toContain('1 member'); // Creator is admin
      expect(workspaceCard).toContain('0 boards');
    });

    test('should show recent activity', async ({ page }) => {
      const workspace = TEST_WORKSPACES.primary;

      await helpers.createWorkspace(workspace);
      await helpers.navigateTo(TEST_URLS.workspaces);

      const workspaceCards = await helpers.getWorkspaceCards();
      const workspaceCard = workspaceCards.find(card => card.includes(workspace.name));
      
      // Should show creation date
      expect(workspaceCard).toContain('Created');
    });

    test('should handle empty workspace list', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspaces);

      // Should show empty state
      const emptyState = helpers.page.locator('[data-testid="empty-workspace-state"]');
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText('No workspaces yet');
    });
  });

  test.describe('Workspace Details and Settings', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.createWorkspace(TEST_WORKSPACES.primary);
    });

    test('should display workspace details', async ({ page }) => {
      const workspace = TEST_WORKSPACES.primary;

      await helpers.navigateTo(TEST_URLS.workspaces);
      const workspaceCards = await helpers.getWorkspaceCards();
      const workspaceCard = workspaceCards.find(card => card.includes(workspace.name));
      
      // Click on workspace to view details
      await helpers.page.click(`[data-testid="workspace-card"]:has-text("${workspace.name}")`);
      await helpers.expectToBeOnPage(TEST_URLS.workspace('workspace-id-placeholder'));

      // Should show workspace name and description
      await expect(helpers.page.locator('[data-testid="workspace-name"]')).toContainText(workspace.name);
      await expect(helpers.page.locator('[data-testid="workspace-description"]')).toContainText(workspace.description);
    });

    test('should edit workspace settings', async ({ page }) => {
      const updatedName = 'Updated Workspace Name';
      const updatedDescription = 'Updated workspace description';

      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.page.click('[data-testid="edit-workspace-button"]');

      await helpers.fillField('[data-testid="workspace-name-input"]', updatedName);
      await helpers.fillField('[data-testid="workspace-description-input"]', updatedDescription);
      await helpers.page.click('[data-testid="save-workspace-button"]');

      await helpers.expectSuccessMessage('Workspace updated successfully');
      await expect(helpers.page.locator('[data-testid="workspace-name"]')).toContainText(updatedName);
    });

    test('should delete workspace', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.page.click('[data-testid="delete-workspace-button"]');

      // Confirm deletion
      await helpers.page.click(SELECTORS.confirmButton);
      await helpers.expectSuccessMessage('Workspace deleted successfully');
      await helpers.expectToBeOnPage(TEST_URLS.workspaces);
    });

    test('should cancel workspace deletion', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.page.click('[data-testid="delete-workspace-button"]');

      // Cancel deletion
      await helpers.page.click(SELECTORS.cancelButton);
      await helpers.expectToBeOnPage(TEST_URLS.workspace('workspace-id-placeholder'));
    });
  });

  test.describe('Member Management', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.createWorkspace(TEST_WORKSPACES.primary);
    });

    test('should invite member to workspace', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.page.click('[data-testid="invite-member-button"]');

      await helpers.fillField('[data-testid="member-email-input"]', TEST_USERS.member.email);
      await helpers.selectOption('[data-testid="member-role-select"]', 'member');
      await helpers.page.click('[data-testid="send-invitation-button"]');

      await helpers.expectSuccessMessage('Invitation sent successfully');
    });

    test('should validate member email', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.page.click('[data-testid="invite-member-button"]');

      await helpers.fillField('[data-testid="member-email-input"]', 'invalid-email');
      await helpers.page.click('[data-testid="send-invitation-button"]');

      await helpers.expectFieldError('[data-testid="member-email-input"]', 'Please enter a valid email address');
    });

    test('should prevent inviting existing member', async ({ page }) => {
      // First invite the member
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.page.click('[data-testid="invite-member-button"]');
      await helpers.fillField('[data-testid="member-email-input"]', TEST_USERS.member.email);
      await helpers.page.click('[data-testid="send-invitation-button"]');

      // Try to invite same member again
      await helpers.page.click('[data-testid="invite-member-button"]');
      await helpers.fillField('[data-testid="member-email-input"]', TEST_USERS.member.email);
      await helpers.page.click('[data-testid="send-invitation-button"]');

      await helpers.expectErrorMessage('User is already a member of this workspace');
    });

    test('should display workspace members', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      
      const membersList = helpers.page.locator('[data-testid="members-list"]');
      await expect(membersList).toBeVisible();

      // Should show admin member
      await expect(membersList).toContainText(TEST_USERS.admin.name);
      await expect(membersList).toContainText('Admin');
    });

    test('should change member role', async ({ page }) => {
      // First invite a member
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.page.click('[data-testid="invite-member-button"]');
      await helpers.fillField('[data-testid="member-email-input"]', TEST_USERS.member.email);
      await helpers.selectOption('[data-testid="member-role-select"]', 'member');
      await helpers.page.click('[data-testid="send-invitation-button"]');

      // Change member role
      await helpers.page.click('[data-testid="member-role-button"]');
      await helpers.selectOption('[data-testid="role-select"]', 'admin');
      await helpers.page.click('[data-testid="update-role-button"]');

      await helpers.expectSuccessMessage('Member role updated successfully');
    });

    test('should remove member from workspace', async ({ page }) => {
      // First invite a member
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.page.click('[data-testid="invite-member-button"]');
      await helpers.fillField('[data-testid="member-email-input"]', TEST_USERS.member.email);
      await helpers.page.click('[data-testid="send-invitation-button"]');

      // Remove member
      await helpers.page.click('[data-testid="remove-member-button"]');
      await helpers.page.click(SELECTORS.confirmButton);

      await helpers.expectSuccessMessage('Member removed successfully');
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('should allow admin to manage workspace', async ({ page }) => {
      await helpers.createWorkspace(TEST_WORKSPACES.primary);
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));

      // Admin should see all management options
      await expect(helpers.page.locator('[data-testid="edit-workspace-button"]')).toBeVisible();
      await expect(helpers.page.locator('[data-testid="invite-member-button"]')).toBeVisible();
      await expect(helpers.page.locator('[data-testid="delete-workspace-button"]')).toBeVisible();
    });

    test('should restrict member access', async ({ page, context }) => {
      // Create workspace as admin
      await helpers.createWorkspace(TEST_WORKSPACES.primary);

      // Switch to member user
      await helpers.logout();
      await helpers.login(TEST_USERS.member);

      // Member should have limited access
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await expect(helpers.page.locator('[data-testid="edit-workspace-button"]')).not.toBeVisible();
      await expect(helpers.page.locator('[data-testid="delete-workspace-button"]')).not.toBeVisible();
    });

    test('should restrict viewer access', async ({ page, context }) => {
      // Create workspace as admin
      await helpers.createWorkspace(TEST_WORKSPACES.primary);

      // Switch to viewer user
      await helpers.logout();
      await helpers.login(TEST_USERS.viewer);

      // Viewer should have read-only access
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await expect(helpers.page.locator('[data-testid="edit-workspace-button"]')).not.toBeVisible();
      await expect(helpers.page.locator('[data-testid="invite-member-button"]')).not.toBeVisible();
      await expect(helpers.page.locator('[data-testid="delete-workspace-button"]')).not.toBeVisible();
    });

    test('should prevent unauthorized access', async ({ page }) => {
      // Try to access workspace without being a member
      await helpers.navigateTo(TEST_URLS.workspace('unauthorized-workspace-id'));

      await helpers.expectErrorMessage('You do not have access to this workspace');
      await helpers.expectToBeOnPage(TEST_URLS.workspaces);
    });
  });

  test.describe('Workspace Search and Filtering', () => {
    test.beforeEach(async ({ page }) => {
      // Create multiple workspaces
      await helpers.createWorkspace(TEST_WORKSPACES.primary);
      await helpers.createWorkspace(TEST_WORKSPACES.secondary);
    });

    test('should search workspaces by name', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.fillField('[data-testid="workspace-search-input"]', TEST_WORKSPACES.primary.name);

      const workspaceCards = await helpers.getWorkspaceCards();
      expect(workspaceCards.length).toBe(1);
      expect(workspaceCards[0]).toContain(TEST_WORKSPACES.primary.name);
    });

    test('should filter workspaces by role', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.selectOption('[data-testid="role-filter-select"]', 'admin');

      const workspaceCards = await helpers.getWorkspaceCards();
      expect(workspaceCards.length).toBeGreaterThan(0);
    });

    test('should clear search and filters', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.fillField('[data-testid="workspace-search-input"]', TEST_WORKSPACES.primary.name);
      await helpers.page.click('[data-testid="clear-search-button"]');

      const workspaceCards = await helpers.getWorkspaceCards();
      expect(workspaceCards.length).toBeGreaterThan(1);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors during workspace creation', async ({ page }) => {
      // Simulate network error
      await page.route('**/api/v1/workspaces**', route => route.abort());

      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.page.click(SELECTORS.createWorkspaceButton);
      await helpers.fillField(SELECTORS.workspaceNameInput, TEST_WORKSPACES.primary.name);
      await helpers.page.click(SELECTORS.workspaceSubmitButton);

      await helpers.expectErrorMessage('Network error occurred');
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Simulate server error
      await page.route('**/api/v1/workspaces**', route => route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      }));

      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.page.click(SELECTORS.createWorkspaceButton);
      await helpers.fillField(SELECTORS.workspaceNameInput, TEST_WORKSPACES.primary.name);
      await helpers.page.click(SELECTORS.workspaceSubmitButton);

      await helpers.expectErrorMessage('Server error occurred');
    });

    test('should handle validation errors gracefully', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.page.click(SELECTORS.createWorkspaceButton);
      await helpers.fillField(SELECTORS.workspaceNameInput, '');
      await helpers.page.click(SELECTORS.workspaceSubmitButton);

      await helpers.expectFieldError(SELECTORS.workspaceNameInput, 'Name is required');
    });
  });

  test.describe('Performance', () => {
    test('should load workspaces within acceptable time', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.expectPageLoadTimeToBeLessThan(3000);
    });

    test('should handle large number of workspaces', async ({ page }) => {
      // Create multiple workspaces
      for (let i = 0; i < 10; i++) {
        await helpers.createWorkspace({
          name: `Test Workspace ${i}`,
          description: `Description for workspace ${i}`
        });
      }

      await helpers.navigateTo(TEST_URLS.workspaces);
      const workspaceCards = await helpers.getWorkspaceCards();
      expect(workspaceCards.length).toBeGreaterThanOrEqual(10);
    });
  });
});
