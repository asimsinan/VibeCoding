/**
 * E2E Tests: Board Management
 * Tests board creation, deletion, column management, and board settings
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from '../setup/test-helpers';
import { TEST_USERS, TEST_WORKSPACES, TEST_BOARDS, TEST_URLS, SELECTORS } from '../setup/test-data';

test.describe('Board Management', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(TEST_USERS.admin);
    await helpers.createWorkspace(TEST_WORKSPACES.primary);
  });

  test.describe('Board Creation', () => {
    test('should create board with valid data', async ({ page }) => {
      const board = TEST_BOARDS.projectAlpha;

      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(board, 'workspace-id-placeholder');
      await helpers.expectBoardToExist(board.title);
      await helpers.expectSuccessMessage('Board created successfully');
    });

    test('should validate required fields', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.page.click(SELECTORS.createBoardButton);
      await helpers.page.click(SELECTORS.boardSubmitButton);

      await helpers.expectFieldError(SELECTORS.boardTitleInput, 'Title is required');
    });

    test('should validate field lengths', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.page.click(SELECTORS.createBoardButton);

      // Test title too long
      await helpers.fillField(SELECTORS.boardTitleInput, 'a'.repeat(101));
      await helpers.page.click(SELECTORS.boardSubmitButton);

      await helpers.expectFieldError(SELECTORS.boardTitleInput, 'Title must be less than 100 characters');

      // Test description too long
      await helpers.fillField(SELECTORS.boardTitleInput, 'Valid Title');
      await helpers.fillField(SELECTORS.boardDescriptionInput, 'a'.repeat(501));
      await helpers.page.click(SELECTORS.boardSubmitButton);

      await helpers.expectFieldError(SELECTORS.boardDescriptionInput, 'Description must be less than 500 characters');
    });

    test('should create board with default columns', async ({ page }) => {
      const board = TEST_BOARDS.projectAlpha;

      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(board, 'workspace-id-placeholder');

      // Navigate to board view
      const boardCards = await helpers.getBoardCards();
      const boardCard = boardCards.find(card => card.includes(board.title));
      await helpers.page.click(`[data-testid="board-card"]:has-text("${board.title}")`);

      // Should have default columns
      const columns = helpers.page.locator('[data-testid="column-header"]');
      await expect(columns).toHaveCount(4); // To Do, In Progress, Review, Done
      await expect(columns.nth(0)).toContainText('To Do');
      await expect(columns.nth(1)).toContainText('In Progress');
      await expect(columns.nth(2)).toContainText('Review');
      await expect(columns.nth(3)).toContainText('Done');
    });

    test('should prevent duplicate board titles in same workspace', async ({ page }) => {
      const board = TEST_BOARDS.projectAlpha;

      // Create first board
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(board, 'workspace-id-placeholder');

      // Try to create board with same title
      await helpers.page.click(SELECTORS.createBoardButton);
      await helpers.fillField(SELECTORS.boardTitleInput, board.title);
      await helpers.fillField(SELECTORS.boardDescriptionInput, 'Different description');
      await helpers.page.click(SELECTORS.boardSubmitButton);

      await helpers.expectErrorMessage('Board title already exists in this workspace');
    });
  });

  test.describe('Board List and Display', () => {
    test('should display workspace boards', async ({ page }) => {
      // Create multiple boards
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(TEST_BOARDS.projectAlpha, 'workspace-id-placeholder');
      await helpers.createBoard(TEST_BOARDS.projectBeta, 'workspace-id-placeholder');

      const boardCards = await helpers.getBoardCards();
      expect(boardCards.length).toBeGreaterThanOrEqual(2);
      expect(boardCards.some(card => card.includes(TEST_BOARDS.projectAlpha.title))).toBe(true);
      expect(boardCards.some(card => card.includes(TEST_BOARDS.projectBeta.title))).toBe(true);
    });

    test('should show board statistics', async ({ page }) => {
      const board = TEST_BOARDS.projectAlpha;

      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(board, 'workspace-id-placeholder');

      const boardCards = await helpers.getBoardCards();
      const boardCard = boardCards.find(card => card.includes(board.title));
      
      // Should show task count and member count
      expect(boardCard).toContain('0 tasks');
      expect(boardCard).toContain('1 member');
    });

    test('should show recent activity', async ({ page }) => {
      const board = TEST_BOARDS.projectAlpha;

      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(board, 'workspace-id-placeholder');

      const boardCards = await helpers.getBoardCards();
      const boardCard = boardCards.find(card => card.includes(board.title));
      
      // Should show creation date
      expect(boardCard).toContain('Created');
    });

    test('should handle empty board list', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));

      // Should show empty state
      const emptyState = helpers.page.locator('[data-testid="empty-board-state"]');
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText('No boards yet');
    });
  });

  test.describe('Board View and Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(TEST_BOARDS.projectAlpha, 'workspace-id-placeholder');
    });

    test('should navigate to board view', async ({ page }) => {
      const board = TEST_BOARDS.projectAlpha;

      const boardCards = await helpers.getBoardCards();
      const boardCard = boardCards.find(card => card.includes(board.title));
      await helpers.page.click(`[data-testid="board-card"]:has-text("${board.title}")`);

      await helpers.expectToBeOnPage(TEST_URLS.board('board-id-placeholder'));
    });

    test('should display board details', async ({ page }) => {
      const board = TEST_BOARDS.projectAlpha;

      await helpers.navigateTo(TEST_URLS.board('board-id-placeholder'));

      // Should show board title and description
      await expect(helpers.page.locator('[data-testid="board-title"]')).toContainText(board.title);
      await expect(helpers.page.locator('[data-testid="board-description"]')).toContainText(board.description);
    });

    test('should display board columns', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.board('board-id-placeholder'));

      const columns = helpers.page.locator('[data-testid="column-header"]');
      await expect(columns).toHaveCount(4);
    });

    test('should show board members', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.board('board-id-placeholder'));

      const membersList = helpers.page.locator('[data-testid="board-members"]');
      await expect(membersList).toBeVisible();
      await expect(membersList).toContainText(TEST_USERS.admin.name);
    });
  });

  test.describe('Column Management', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(TEST_BOARDS.projectAlpha, 'workspace-id-placeholder');
      await helpers.navigateTo(TEST_URLS.board('board-id-placeholder'));
    });

    test('should add new column', async ({ page }) => {
      await helpers.page.click('[data-testid="add-column-button"]');
      await helpers.fillField('[data-testid="column-title-input"]', 'New Column');
      await helpers.page.click('[data-testid="create-column-button"]');

      await helpers.expectSuccessMessage('Column created successfully');
      
      const columns = helpers.page.locator('[data-testid="column-header"]');
      await expect(columns).toHaveCount(5);
      await expect(columns.nth(4)).toContainText('New Column');
    });

    test('should edit column title', async ({ page }) => {
      const updatedTitle = 'Updated Column Title';

      await helpers.page.click('[data-testid="column-menu-button"]');
      await helpers.page.click('[data-testid="edit-column-button"]');
      await helpers.fillField('[data-testid="column-title-input"]', updatedTitle);
      await helpers.page.click('[data-testid="save-column-button"]');

      await helpers.expectSuccessMessage('Column updated successfully');
      await expect(helpers.page.locator('[data-testid="column-title"]').first()).toContainText(updatedTitle);
    });

    test('should reorder columns', async ({ page }) => {
      // Drag first column to second position
      const firstColumn = helpers.page.locator('[data-testid="column-header"]').first();
      const secondColumn = helpers.page.locator('[data-testid="column-header"]').nth(1);

      await firstColumn.dragTo(secondColumn);
      await helpers.waitForLoadingToComplete();

      // Verify columns are reordered
      const columns = helpers.page.locator('[data-testid="column-header"]');
      await expect(columns.nth(0)).toContainText('In Progress');
      await expect(columns.nth(1)).toContainText('To Do');
    });

    test('should delete column', async ({ page }) => {
      // First add a column to delete
      await helpers.page.click('[data-testid="add-column-button"]');
      await helpers.fillField('[data-testid="column-title-input"]', 'Column to Delete');
      await helpers.page.click('[data-testid="create-column-button"]');

      // Delete the column
      await helpers.page.click('[data-testid="column-menu-button"]');
      await helpers.page.click('[data-testid="delete-column-button"]');
      await helpers.page.click(SELECTORS.confirmButton);

      await helpers.expectSuccessMessage('Column deleted successfully');
      
      const columns = helpers.page.locator('[data-testid="column-header"]');
      await expect(columns).toHaveCount(4);
    });

    test('should prevent deleting last column', async ({ page }) => {
      // Try to delete all columns except one
      for (let i = 0; i < 3; i++) {
        await helpers.page.click('[data-testid="column-menu-button"]');
        await helpers.page.click('[data-testid="delete-column-button"]');
        await helpers.page.click(SELECTORS.confirmButton);
      }

      // Try to delete the last column
      await helpers.page.click('[data-testid="column-menu-button"]');
      await helpers.page.click('[data-testid="delete-column-button"]');

      await helpers.expectErrorMessage('Cannot delete the last column');
    });

    test('should validate column title', async ({ page }) => {
      await helpers.page.click('[data-testid="add-column-button"]');
      await helpers.page.click('[data-testid="create-column-button"]');

      await helpers.expectFieldError('[data-testid="column-title-input"]', 'Title is required');
    });
  });

  test.describe('Board Settings', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(TEST_BOARDS.projectAlpha, 'workspace-id-placeholder');
    });

    test('should edit board settings', async ({ page }) => {
      const updatedTitle = 'Updated Board Title';
      const updatedDescription = 'Updated board description';

      await helpers.navigateTo(TEST_URLS.board('board-id-placeholder'));
      await helpers.page.click('[data-testid="board-settings-button"]');

      await helpers.fillField('[data-testid="board-title-input"]', updatedTitle);
      await helpers.fillField('[data-testid="board-description-input"]', updatedDescription);
      await helpers.page.click('[data-testid="save-board-settings-button"]');

      await helpers.expectSuccessMessage('Board settings updated successfully');
      await expect(helpers.page.locator('[data-testid="board-title"]')).toContainText(updatedTitle);
    });

    test('should change board visibility', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.board('board-id-placeholder'));
      await helpers.page.click('[data-testid="board-settings-button"]');

      await helpers.selectOption('[data-testid="board-visibility-select"]', 'private');
      await helpers.page.click('[data-testid="save-board-settings-button"]');

      await helpers.expectSuccessMessage('Board settings updated successfully');
    });

    test('should archive board', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.board('board-id-placeholder'));
      await helpers.page.click('[data-testid="board-settings-button"]');
      await helpers.page.click('[data-testid="archive-board-button"]');
      await helpers.page.click(SELECTORS.confirmButton);

      await helpers.expectSuccessMessage('Board archived successfully');
      await helpers.expectToBeOnPage(TEST_URLS.workspace('workspace-id-placeholder'));
    });

    test('should delete board permanently', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.board('board-id-placeholder'));
      await helpers.page.click('[data-testid="board-settings-button"]');
      await helpers.page.click('[data-testid="delete-board-button"]');
      await helpers.page.click(SELECTORS.confirmButton);

      await helpers.expectSuccessMessage('Board deleted permanently');
      await helpers.expectToBeOnPage(TEST_URLS.workspace('workspace-id-placeholder'));
    });
  });

  test.describe('Board Permissions', () => {
    test('should allow admin to manage board', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(TEST_BOARDS.projectAlpha, 'workspace-id-placeholder');
      await helpers.navigateTo(TEST_URLS.board('board-id-placeholder'));

      // Admin should see all management options
      await expect(helpers.page.locator('[data-testid="board-settings-button"]')).toBeVisible();
      await expect(helpers.page.locator('[data-testid="add-column-button"]')).toBeVisible();
    });

    test('should restrict member access', async ({ page, context }) => {
      // Create board as admin
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(TEST_BOARDS.projectAlpha, 'workspace-id-placeholder');

      // Switch to member user
      await helpers.logout();
      await helpers.login(TEST_USERS.member);

      // Member should have limited access
      await helpers.navigateTo(TEST_URLS.board('board-id-placeholder'));
      await expect(helpers.page.locator('[data-testid="board-settings-button"]')).not.toBeVisible();
    });

    test('should restrict viewer access', async ({ page, context }) => {
      // Create board as admin
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(TEST_BOARDS.projectAlpha, 'workspace-id-placeholder');

      // Switch to viewer user
      await helpers.logout();
      await helpers.login(TEST_USERS.viewer);

      // Viewer should have read-only access
      await helpers.navigateTo(TEST_URLS.board('board-id-placeholder'));
      await expect(helpers.page.locator('[data-testid="board-settings-button"]')).not.toBeVisible();
      await expect(helpers.page.locator('[data-testid="add-column-button"]')).not.toBeVisible();
    });
  });

  test.describe('Board Search and Filtering', () => {
    test.beforeEach(async ({ page }) => {
      // Create multiple boards
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(TEST_BOARDS.projectAlpha, 'workspace-id-placeholder');
      await helpers.createBoard(TEST_BOARDS.projectBeta, 'workspace-id-placeholder');
    });

    test('should search boards by title', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.fillField('[data-testid="board-search-input"]', TEST_BOARDS.projectAlpha.title);

      const boardCards = await helpers.getBoardCards();
      expect(boardCards.length).toBe(1);
      expect(boardCards[0]).toContain(TEST_BOARDS.projectAlpha.title);
    });

    test('should filter boards by status', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.selectOption('[data-testid="board-status-filter"]', 'active');

      const boardCards = await helpers.getBoardCards();
      expect(boardCards.length).toBeGreaterThan(0);
    });

    test('should clear search and filters', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.fillField('[data-testid="board-search-input"]', TEST_BOARDS.projectAlpha.title);
      await helpers.page.click('[data-testid="clear-search-button"]');

      const boardCards = await helpers.getBoardCards();
      expect(boardCards.length).toBeGreaterThan(1);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors during board creation', async ({ page }) => {
      // Simulate network error
      await page.route('**/api/v1/boards**', route => route.abort());

      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.page.click(SELECTORS.createBoardButton);
      await helpers.fillField(SELECTORS.boardTitleInput, TEST_BOARDS.projectAlpha.title);
      await helpers.page.click(SELECTORS.boardSubmitButton);

      await helpers.expectErrorMessage('Network error occurred');
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Simulate server error
      await page.route('**/api/v1/boards**', route => route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      }));

      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.page.click(SELECTORS.createBoardButton);
      await helpers.fillField(SELECTORS.boardTitleInput, TEST_BOARDS.projectAlpha.title);
      await helpers.page.click(SELECTORS.boardSubmitButton);

      await helpers.expectErrorMessage('Server error occurred');
    });
  });

  test.describe('Performance', () => {
    test('should load board within acceptable time', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(TEST_BOARDS.projectAlpha, 'workspace-id-placeholder');
      await helpers.navigateTo(TEST_URLS.board('board-id-placeholder'));
      await helpers.expectPageLoadTimeToBeLessThan(3000);
    });

    test('should handle large number of columns', async ({ page }) => {
      await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
      await helpers.createBoard(TEST_BOARDS.projectAlpha, 'workspace-id-placeholder');
      await helpers.navigateTo(TEST_URLS.board('board-id-placeholder'));

      // Add multiple columns
      for (let i = 0; i < 10; i++) {
        await helpers.page.click('[data-testid="add-column-button"]');
        await helpers.fillField('[data-testid="column-title-input"]', `Column ${i}`);
        await helpers.page.click('[data-testid="create-column-button"]');
      }

      const columns = helpers.page.locator('[data-testid="column-header"]');
      await expect(columns).toHaveCount(14); // 4 default + 10 new
    });
  });
});
