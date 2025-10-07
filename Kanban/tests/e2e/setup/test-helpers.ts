/**
 * E2E Test Helpers
 * Provides utility functions for E2E tests
 */

import { Page, expect } from '@playwright/test';
import { TestUser, TestWorkspace, TestBoard, TestTask, SELECTORS, TEST_URLS } from './test-data';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to a specific URL
   */
  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForElementHidden(selector: string, timeout = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  /**
   * Click element and wait for navigation
   */
  async clickAndWaitForNavigation(selector: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(selector),
    ]);
  }

  /**
   * Fill form field
   */
  async fillField(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.selectOption(selector, value);
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get element text content
   */
  async getElementText(selector: string): Promise<string> {
    const element = await this.page.waitForSelector(selector);
    return await element.textContent() || '';
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingToComplete(): Promise<void> {
    // Wait for loading spinners to disappear
    await this.page.waitForFunction(() => {
      const spinners = document.querySelectorAll('[data-testid="loading-spinner"]');
      return spinners.length === 0;
    }, { timeout: 10000 });

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Authentication helpers
   */
  async login(user: TestUser): Promise<void> {
    await this.navigateTo(TEST_URLS.login);
    await this.fillField(SELECTORS.emailInput, user.email);
    await this.fillField(SELECTORS.passwordInput, user.password);
    await this.page.click(SELECTORS.loginButton);
    await this.waitForLoadingToComplete();
  }

  async logout(): Promise<void> {
    await this.page.click(SELECTORS.logoutButton);
    await this.waitForLoadingToComplete();
  }

  async signup(user: TestUser): Promise<void> {
    await this.navigateTo(TEST_URLS.signup);
    await this.fillField(SELECTORS.emailInput, user.email);
    await this.fillField(SELECTORS.passwordInput, user.password);
    await this.page.click(SELECTORS.signupButton);
    await this.waitForLoadingToComplete();
  }

  /**
   * Workspace management helpers
   */
  async createWorkspace(workspace: TestWorkspace): Promise<void> {
    await this.navigateTo(TEST_URLS.workspaces);
    await this.page.click(SELECTORS.createWorkspaceButton);
    await this.waitForElement(SELECTORS.createWorkspaceForm);
    
    await this.fillField(SELECTORS.workspaceNameInput, workspace.name);
    await this.fillField(SELECTORS.workspaceDescriptionInput, workspace.description);
    await this.page.click(SELECTORS.workspaceSubmitButton);
    await this.waitForLoadingToComplete();
  }

  async getWorkspaceCards(): Promise<string[]> {
    await this.waitForElement(SELECTORS.workspaceList);
    const cards = await this.page.$$(SELECTORS.workspaceCard);
    return Promise.all(cards.map(card => card.textContent() || ''));
  }

  /**
   * Board management helpers
   */
  async createBoard(board: TestBoard, workspaceId: string): Promise<void> {
    await this.navigateTo(TEST_URLS.workspace(workspaceId));
    await this.page.click(SELECTORS.createBoardButton);
    await this.waitForElement(SELECTORS.createBoardForm);
    
    await this.fillField(SELECTORS.boardTitleInput, board.title);
    await this.fillField(SELECTORS.boardDescriptionInput, board.description);
    await this.page.click(SELECTORS.boardSubmitButton);
    await this.waitForLoadingToComplete();
  }

  async getBoardCards(): Promise<string[]> {
    await this.waitForElement(SELECTORS.boardList);
    const cards = await this.page.$$(SELECTORS.boardCard);
    return Promise.all(cards.map(card => card.textContent() || ''));
  }

  /**
   * Task management helpers
   */
  async createTask(task: TestTask, columnId: string): Promise<void> {
    await this.page.click(`${SELECTORS.addTaskToColumnButton}[data-column-id="${columnId}"]`);
    await this.waitForElement(SELECTORS.createTaskForm);
    
    await this.fillField(SELECTORS.taskTitleInput, task.title);
    await this.fillField(SELECTORS.taskDescriptionInput, task.description);
    await this.selectOption(SELECTORS.taskPrioritySelect, task.priority);
    
    if (task.assignee) {
      await this.selectOption(SELECTORS.taskAssigneeSelect, task.assignee);
    }
    
    await this.page.click(SELECTORS.taskSubmitButton);
    await this.waitForLoadingToComplete();
  }

  async getTaskCards(): Promise<string[]> {
    await this.waitForElement(SELECTORS.taskList);
    const cards = await this.page.$$(SELECTORS.taskCard);
    return Promise.all(cards.map(card => card.textContent() || ''));
  }

  /**
   * Drag and drop helpers
   */
  async dragTaskToColumn(taskId: string, columnId: string): Promise<void> {
    const taskElement = this.page.locator(`${SELECTORS.draggableTask}[data-task-id="${taskId}"]`);
    const columnElement = this.page.locator(`${SELECTORS.droppableColumn}[data-column-id="${columnId}"]`);
    
    await taskElement.dragTo(columnElement);
    await this.waitForLoadingToComplete();
  }

  /**
   * Modal helpers
   */
  async openModal(triggerSelector: string): Promise<void> {
    await this.page.click(triggerSelector);
    await this.waitForElement(SELECTORS.modal);
  }

  async closeModal(): Promise<void> {
    await this.page.click(SELECTORS.modalCloseButton);
    await this.waitForElementHidden(SELECTORS.modal);
  }

  /**
   * Error handling helpers
   */
  async expectErrorMessage(message: string): Promise<void> {
    await this.waitForElement(SELECTORS.errorMessage);
    const errorText = await this.getElementText(SELECTORS.errorMessage);
    expect(errorText).toContain(message);
  }

  async expectSuccessMessage(message: string): Promise<void> {
    await this.waitForElement(SELECTORS.successMessage);
    const successText = await this.getElementText(SELECTORS.successMessage);
    expect(successText).toContain(message);
  }

  /**
   * Form validation helpers
   */
  async expectFieldError(fieldSelector: string, errorMessage: string): Promise<void> {
    const field = this.page.locator(fieldSelector);
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    
    const errorElement = this.page.locator(`${fieldSelector} + [data-testid="field-error"]`);
    await expect(errorElement).toContainText(errorMessage);
  }

  /**
   * Navigation helpers
   */
  async expectToBeOnPage(expectedUrl: string): Promise<void> {
    await this.page.waitForURL(expectedUrl);
    expect(this.page.url()).toBe(expectedUrl);
  }

  async expectToBeLoggedIn(): Promise<void> {
    await this.waitForElement(SELECTORS.logoutButton);
  }

  async expectToBeLoggedOut(): Promise<void> {
    await this.waitForElement(SELECTORS.loginForm);
  }

  /**
   * Data verification helpers
   */
  async expectWorkspaceToExist(workspaceName: string): Promise<void> {
    const workspaceCards = await this.getWorkspaceCards();
    expect(workspaceCards.some(card => card.includes(workspaceName))).toBe(true);
  }

  async expectBoardToExist(boardTitle: string): Promise<void> {
    const boardCards = await this.getBoardCards();
    expect(boardCards.some(card => card.includes(boardTitle))).toBe(true);
  }

  async expectTaskToExist(taskTitle: string): Promise<void> {
    const taskCards = await this.getTaskCards();
    expect(taskCards.some(card => card.includes(taskTitle))).toBe(true);
  }

  /**
   * Cleanup helpers
   */
  async cleanupTestData(): Promise<void> {
    // This would typically involve API calls to clean up test data
    // For now, we'll just log that cleanup is needed
    console.log('Test data cleanup needed - implement API cleanup calls');
  }

  /**
   * Performance helpers
   */
  async measurePageLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  async expectPageLoadTimeToBeLessThan(maxTime: number): Promise<void> {
    const loadTime = await this.measurePageLoadTime();
    expect(loadTime).toBeLessThan(maxTime);
  }
}
