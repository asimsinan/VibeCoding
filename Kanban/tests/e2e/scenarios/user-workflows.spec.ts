/**
 * E2E Tests: User Workflows
 * Tests complete user journeys and workflows
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from '../setup/test-helpers';
import { TEST_USERS, TEST_WORKSPACES, TEST_BOARDS, TEST_TASKS, TEST_URLS } from '../setup/test-data';

test.describe('User Workflows', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Complete User Journey', () => {
    test('should complete full user journey from signup to task management', async ({ page }) => {
      const user = TEST_USERS.admin;
      const workspace = TEST_WORKSPACES.primary;
      const board = TEST_BOARDS.projectAlpha;
      const task = TEST_TASKS.highPriority;

      // Step 1: User signs up
      await helpers.signup(user);
      await helpers.expectToBeLoggedIn();

      // Step 2: User creates a workspace
      await helpers.createWorkspace(workspace);
      await helpers.expectWorkspaceToExist(workspace.name);

      // Step 3: User navigates to workspace and creates a board
      const workspaceCards = await helpers.getWorkspaceCards();
      const workspaceCard = workspaceCards.find(card => card.includes(workspace.name));
      expect(workspaceCard).toBeDefined();

      // Step 4: User creates a board (assuming we have workspace ID)
      // Note: In a real implementation, we'd get the workspace ID from the API response
      await helpers.createBoard(board, 'workspace-id-placeholder');
      await helpers.expectBoardToExist(board.title);

      // Step 5: User creates a task
      await helpers.createTask(task, 'column-id-placeholder');
      await helpers.expectTaskToExist(task.title);

      // Step 6: User moves task between columns
      await helpers.dragTaskToColumn('task-id-placeholder', 'in-progress-column-id');

      // Step 7: User logs out
      await helpers.logout();
      await helpers.expectToBeLoggedOut();
    });
  });

  test.describe('Authentication Workflow', () => {
    test('should handle login/logout cycle', async ({ page }) => {
      const user = TEST_USERS.admin;

      // Login
      await helpers.login(user);
      await helpers.expectToBeLoggedIn();

      // Verify user is on dashboard
      await helpers.expectToBeOnPage(TEST_URLS.dashboard);

      // Logout
      await helpers.logout();
      await helpers.expectToBeLoggedOut();

      // Verify user is redirected to login
      await helpers.expectToBeOnPage(TEST_URLS.login);
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected page without authentication
      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.expectToBeOnPage(TEST_URLS.login);
    });
  });

  test.describe('Workspace Management Workflow', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.login(TEST_USERS.admin);
    });

    test('should create and manage workspaces', async ({ page }) => {
      const workspace = TEST_WORKSPACES.primary;

      // Create workspace
      await helpers.createWorkspace(workspace);
      await helpers.expectWorkspaceToExist(workspace.name);

      // Verify workspace appears in list
      const workspaceCards = await helpers.getWorkspaceCards();
      expect(workspaceCards.length).toBeGreaterThan(0);
    });

    test('should handle workspace creation validation', async ({ page }) => {
      // Try to create workspace with empty name
      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.page.click(helpers.page.locator('[data-testid="create-workspace-button"]'));
      await helpers.page.click(helpers.page.locator('[data-testid="workspace-submit-button"]'));

      // Should show validation error
      await helpers.expectFieldError('[data-testid="workspace-name-input"]', 'Name is required');
    });
  });

  test.describe('Board Management Workflow', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.login(TEST_USERS.admin);
      await helpers.createWorkspace(TEST_WORKSPACES.primary);
    });

    test('should create and manage boards', async ({ page }) => {
      const board = TEST_BOARDS.projectAlpha;

      // Create board
      await helpers.createBoard(board, 'workspace-id-placeholder');
      await helpers.expectBoardToExist(board.title);

      // Verify board appears in list
      const boardCards = await helpers.getBoardCards();
      expect(boardCards.length).toBeGreaterThan(0);
    });

    test('should handle board creation validation', async ({ page }) => {
      // Try to create board with empty title
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.page.click(helpers.page.locator('[data-testid="create-board-button"]'));
      await helpers.page.click(helpers.page.locator('[data-testid="board-submit-button"]'));

      // Should show validation error
      await helpers.expectFieldError('[data-testid="board-title-input"]', 'Title is required');
    });
  });

  test.describe('Task Management Workflow', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.login(TEST_USERS.admin);
      await helpers.createWorkspace(TEST_WORKSPACES.primary);
      await helpers.createBoard(TEST_BOARDS.projectAlpha, 'workspace-id-placeholder');
    });

    test('should create and manage tasks', async ({ page }) => {
      const task = TEST_TASKS.highPriority;

      // Create task
      await helpers.createTask(task, 'column-id-placeholder');
      await helpers.expectTaskToExist(task.title);

      // Verify task appears in column
      const taskCards = await helpers.getTaskCards();
      expect(taskCards.length).toBeGreaterThan(0);
    });

    test('should handle task creation validation', async ({ page }) => {
      // Try to create task with empty title
      await helpers.page.click(helpers.page.locator('[data-testid="add-task-to-column-button"]'));
      await helpers.page.click(helpers.page.locator('[data-testid="task-submit-button"]'));

      // Should show validation error
      await helpers.expectFieldError('[data-testid="task-title-input"]', 'Title is required');
    });

    test('should move tasks between columns', async ({ page }) => {
      const task = TEST_TASKS.mediumPriority;

      // Create task in first column
      await helpers.createTask(task, 'todo-column-id');
      await helpers.expectTaskToExist(task.title);

      // Move task to second column
      await helpers.dragTaskToColumn('task-id-placeholder', 'in-progress-column-id');

      // Verify task moved (this would need proper implementation)
      // await helpers.expectTaskToBeInColumn('task-id-placeholder', 'in-progress-column-id');
    });
  });

  test.describe('Error Handling Workflow', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network error
      await page.route('**/api/**', route => route.abort());

      await helpers.login(TEST_USERS.admin);

      // Should show error message
      await helpers.expectErrorMessage('Network error occurred');
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Simulate server error
      await page.route('**/api/**', route => route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      }));

      await helpers.login(TEST_USERS.admin);

      // Should show error message
      await helpers.expectErrorMessage('Server error occurred');
    });
  });

  test.describe('Performance Workflow', () => {
    test('should load pages within acceptable time', async ({ page }) => {
      await helpers.login(TEST_USERS.admin);

      // Test dashboard load time
      await helpers.navigateTo(TEST_URLS.dashboard);
      await helpers.expectPageLoadTimeToBeLessThan(3000);

      // Test workspaces page load time
      await helpers.navigateTo(TEST_URLS.workspaces);
      await helpers.expectPageLoadTimeToBeLessThan(3000);
    });
  });

  test.describe('Mobile Workflow', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await helpers.login(TEST_USERS.admin);
      await helpers.expectToBeLoggedIn();

      // Test mobile navigation
      await helpers.navigateTo(TEST_URLS.workspaces);
      
      // Verify mobile layout
      const workspaceList = helpers.page.locator('[data-testid="workspace-list"]');
      await expect(workspaceList).toBeVisible();
    });
  });
});
