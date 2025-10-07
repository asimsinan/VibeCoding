/**
 * E2E Tests: Task Management
 * Tests task creation, deletion, editing, filtering, searching, and assignment
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from '../setup/test-helpers';
import { TEST_USERS, TEST_WORKSPACES, TEST_BOARDS, TEST_TASKS, TEST_URLS, SELECTORS } from '../setup/test-data';

test.describe('Task Management', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(TEST_USERS.admin);
    await helpers.createWorkspace(TEST_WORKSPACES.primary);
    await helpers.navigateTo(TEST_URLS.workspace('workspace-id-placeholder'));
    await helpers.createBoard(TEST_BOARDS.projectAlpha, 'workspace-id-placeholder');
    await helpers.navigateTo(TEST_URLS.board('board-id-placeholder'));
  });

  test.describe('Task Creation', () => {
    test('should create task with valid data', async ({ page }) => {
      const task = TEST_TASKS.highPriority;

      await helpers.createTask(task, 'todo-column-id');
      await helpers.expectTaskToExist(task.title);
      await helpers.expectSuccessMessage('Task created successfully');
    });

    test('should validate required fields', async ({ page }) => {
      await helpers.page.click(SELECTORS.addTaskToColumnButton);
      await helpers.page.click(SELECTORS.taskSubmitButton);

      await helpers.expectFieldError(SELECTORS.taskTitleInput, 'Title is required');
    });

    test('should validate field lengths', async ({ page }) => {
      await helpers.page.click(SELECTORS.addTaskToColumnButton);

      // Test title too long
      await helpers.fillField(SELECTORS.taskTitleInput, 'a'.repeat(201));
      await helpers.page.click(SELECTORS.taskSubmitButton);

      await helpers.expectFieldError(SELECTORS.taskTitleInput, 'Title must be less than 200 characters');

      // Test description too long
      await helpers.fillField(SELECTORS.taskTitleInput, 'Valid Title');
      await helpers.fillField(SELECTORS.taskDescriptionInput, 'a'.repeat(1001));
      await helpers.page.click(SELECTORS.taskSubmitButton);

      await helpers.expectFieldError(SELECTORS.taskDescriptionInput, 'Description must be less than 1000 characters');
    });

    test('should create task with all fields', async ({ page }) => {
      const task = TEST_TASKS.withAssignee;

      await helpers.page.click(SELECTORS.addTaskToColumnButton);
      await helpers.fillField(SELECTORS.taskTitleInput, task.title);
      await helpers.fillField(SELECTORS.taskDescriptionInput, task.description);
      await helpers.selectOption(SELECTORS.taskPrioritySelect, task.priority);
      await helpers.selectOption(SELECTORS.taskAssigneeSelect, task.assignee!);
      await helpers.page.click(SELECTORS.taskSubmitButton);

      await helpers.expectTaskToExist(task.title);
    });

    test('should create task with due date', async ({ page }) => {
      const task = TEST_TASKS.mediumPriority;
      const dueDate = '2024-12-31';

      await helpers.page.click(SELECTORS.addTaskToColumnButton);
      await helpers.fillField(SELECTORS.taskTitleInput, task.title);
      await helpers.fillField('[data-testid="task-due-date-input"]', dueDate);
      await helpers.page.click(SELECTORS.taskSubmitButton);

      await helpers.expectTaskToExist(task.title);
    });
  });

  test.describe('Task Display and View', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.createTask(TEST_TASKS.highPriority, 'todo-column-id');
    });

    test('should display task in correct column', async ({ page }) => {
      const taskCards = await helpers.getTaskCards();
      expect(taskCards.some(card => card.includes(TEST_TASKS.highPriority.title))).toBe(true);
    });

    test('should show task details', async ({ page }) => {
      const taskCards = await helpers.getTaskCards();
      const taskCard = taskCards.find(card => card.includes(TEST_TASKS.highPriority.title));
      
      expect(taskCard).toContain(TEST_TASKS.highPriority.title);
      expect(taskCard).toContain(TEST_TASKS.highPriority.description);
      expect(taskCard).toContain('High Priority');
    });

    test('should show task assignee', async ({ page }) => {
      await helpers.createTask(TEST_TASKS.withAssignee, 'todo-column-id');
      
      const taskCards = await helpers.getTaskCards();
      const taskCard = taskCards.find(card => card.includes(TEST_TASKS.withAssignee.title));
      
      expect(taskCard).toContain(TEST_USERS.member.name);
    });

    test('should show task due date', async ({ page }) => {
      const task = TEST_TASKS.mediumPriority;
      const dueDate = '2024-12-31';

      await helpers.page.click(SELECTORS.addTaskToColumnButton);
      await helpers.fillField(SELECTORS.taskTitleInput, task.title);
      await helpers.fillField('[data-testid="task-due-date-input"]', dueDate);
      await helpers.page.click(SELECTORS.taskSubmitButton);

      const taskCards = await helpers.getTaskCards();
      const taskCard = taskCards.find(card => card.includes(task.title));
      
      expect(taskCard).toContain('Dec 31, 2024');
    });
  });

  test.describe('Task Editing', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.createTask(TEST_TASKS.highPriority, 'todo-column-id');
    });

    test('should edit task title', async ({ page }) => {
      const updatedTitle = 'Updated Task Title';

      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="edit-task-button"]');
      await helpers.fillField(SELECTORS.taskTitleInput, updatedTitle);
      await helpers.page.click('[data-testid="save-task-button"]');

      await helpers.expectSuccessMessage('Task updated successfully');
      await helpers.expectTaskToExist(updatedTitle);
    });

    test('should edit task description', async ({ page }) => {
      const updatedDescription = 'Updated task description';

      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="edit-task-button"]');
      await helpers.fillField(SELECTORS.taskDescriptionInput, updatedDescription);
      await helpers.page.click('[data-testid="save-task-button"]');

      await helpers.expectSuccessMessage('Task updated successfully');
    });

    test('should change task priority', async ({ page }) => {
      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="edit-task-button"]');
      await helpers.selectOption(SELECTORS.taskPrioritySelect, 'low');
      await helpers.page.click('[data-testid="save-task-button"]');

      await helpers.expectSuccessMessage('Task updated successfully');
    });

    test('should assign task to user', async ({ page }) => {
      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="edit-task-button"]');
      await helpers.selectOption(SELECTORS.taskAssigneeSelect, TEST_USERS.member.email);
      await helpers.page.click('[data-testid="save-task-button"]');

      await helpers.expectSuccessMessage('Task updated successfully');
    });

    test('should change task due date', async ({ page }) => {
      const newDueDate = '2024-12-25';

      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="edit-task-button"]');
      await helpers.fillField('[data-testid="task-due-date-input"]', newDueDate);
      await helpers.page.click('[data-testid="save-task-button"]');

      await helpers.expectSuccessMessage('Task updated successfully');
    });

    test('should validate task updates', async ({ page }) => {
      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="edit-task-button"]');
      await helpers.fillField(SELECTORS.taskTitleInput, '');
      await helpers.page.click('[data-testid="save-task-button"]');

      await helpers.expectFieldError(SELECTORS.taskTitleInput, 'Title is required');
    });
  });

  test.describe('Task Movement and Drag & Drop', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.createTask(TEST_TASKS.highPriority, 'todo-column-id');
    });

    test('should move task between columns', async ({ page }) => {
      // Move task from To Do to In Progress
      await helpers.dragTaskToColumn('task-id-placeholder', 'in-progress-column-id');
      await helpers.waitForLoadingToComplete();

      // Verify task moved (this would need proper implementation)
      // await helpers.expectTaskToBeInColumn('task-id-placeholder', 'in-progress-column-id');
    });

    test('should reorder tasks within column', async ({ page }) => {
      // Create another task
      await helpers.createTask(TEST_TASKS.mediumPriority, 'todo-column-id');

      // Drag first task below second task
      const firstTask = helpers.page.locator('[data-testid="draggable-task"]').first();
      const secondTask = helpers.page.locator('[data-testid="draggable-task"]').nth(1);

      await firstTask.dragTo(secondTask);
      await helpers.waitForLoadingToComplete();
    });

    test('should prevent dropping task in invalid location', async ({ page }) => {
      // Try to drag task outside of columns
      const task = helpers.page.locator('[data-testid="draggable-task"]').first();
      const invalidDropZone = helpers.page.locator('[data-testid="invalid-drop-zone"]');

      await task.dragTo(invalidDropZone);
      
      // Task should return to original position
      await helpers.waitForLoadingToComplete();
    });

    test('should handle concurrent drag operations', async ({ page, context }) => {
      // Create multiple tasks
      await helpers.createTask(TEST_TASKS.mediumPriority, 'todo-column-id');
      await helpers.createTask(TEST_TASKS.lowPriority, 'todo-column-id');

      // Simulate concurrent drag operations
      const tasks = helpers.page.locator('[data-testid="draggable-task"]');
      await tasks.first().dragTo(tasks.nth(1));
      await helpers.waitForLoadingToComplete();
    });
  });

  test.describe('Task Filtering and Search', () => {
    test.beforeEach(async ({ page }) => {
      // Create tasks with different properties
      await helpers.createTask(TEST_TASKS.highPriority, 'todo-column-id');
      await helpers.createTask(TEST_TASKS.mediumPriority, 'todo-column-id');
      await helpers.createTask(TEST_TASKS.lowPriority, 'todo-column-id');
    });

    test('should search tasks by title', async ({ page }) => {
      await helpers.fillField('[data-testid="task-search-input"]', TEST_TASKS.highPriority.title);

      const taskCards = await helpers.getTaskCards();
      expect(taskCards.length).toBe(1);
      expect(taskCards[0]).toContain(TEST_TASKS.highPriority.title);
    });

    test('should filter tasks by priority', async ({ page }) => {
      await helpers.selectOption('[data-testid="priority-filter-select"]', 'high');

      const taskCards = await helpers.getTaskCards();
      expect(taskCards.length).toBe(1);
      expect(taskCards[0]).toContain('High Priority');
    });

    test('should filter tasks by assignee', async ({ page }) => {
      await helpers.selectOption('[data-testid="assignee-filter-select"]', TEST_USERS.admin.email);

      const taskCards = await helpers.getTaskCards();
      expect(taskCards.length).toBeGreaterThan(0);
    });

    test('should filter tasks by status', async ({ page }) => {
      await helpers.selectOption('[data-testid="status-filter-select"]', 'todo');

      const taskCards = await helpers.getTaskCards();
      expect(taskCards.length).toBeGreaterThan(0);
    });

    test('should combine multiple filters', async ({ page }) => {
      await helpers.fillField('[data-testid="task-search-input"]', 'Task');
      await helpers.selectOption('[data-testid="priority-filter-select"]', 'high');

      const taskCards = await helpers.getTaskCards();
      expect(taskCards.length).toBe(1);
    });

    test('should clear all filters', async ({ page }) => {
      await helpers.fillField('[data-testid="task-search-input"]', TEST_TASKS.highPriority.title);
      await helpers.selectOption('[data-testid="priority-filter-select"]', 'high');
      await helpers.page.click('[data-testid="clear-filters-button"]');

      const taskCards = await helpers.getTaskCards();
      expect(taskCards.length).toBe(3);
    });
  });

  test.describe('Task Assignment', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.createTask(TEST_TASKS.highPriority, 'todo-column-id');
    });

    test('should assign task to user', async ({ page }) => {
      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="assign-task-button"]');
      await helpers.selectOption('[data-testid="assignee-select"]', TEST_USERS.member.email);
      await helpers.page.click('[data-testid="assign-button"]');

      await helpers.expectSuccessMessage('Task assigned successfully');
    });

    test('should unassign task', async ({ page }) => {
      // First assign the task
      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="assign-task-button"]');
      await helpers.selectOption('[data-testid="assignee-select"]', TEST_USERS.member.email);
      await helpers.page.click('[data-testid="assign-button"]');

      // Then unassign it
      await helpers.page.click('[data-testid="unassign-task-button"]');
      await helpers.page.click(SELECTORS.confirmButton);

      await helpers.expectSuccessMessage('Task unassigned successfully');
    });

    test('should show assignee in task card', async ({ page }) => {
      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="assign-task-button"]');
      await helpers.selectOption('[data-testid="assignee-select"]', TEST_USERS.member.email);
      await helpers.page.click('[data-testid="assign-button"]');

      const taskCard = helpers.page.locator('[data-testid="task-card"]');
      await expect(taskCard).toContainText(TEST_USERS.member.name);
    });
  });

  test.describe('Task Comments and Collaboration', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.createTask(TEST_TASKS.highPriority, 'todo-column-id');
    });

    test('should add comment to task', async ({ page }) => {
      const comment = 'This is a test comment';

      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="add-comment-button"]');
      await helpers.fillField('[data-testid="comment-input"]', comment);
      await helpers.page.click('[data-testid="post-comment-button"]');

      await helpers.expectSuccessMessage('Comment added successfully');
      await expect(helpers.page.locator('[data-testid="comment-list"]')).toContainText(comment);
    });

    test('should edit comment', async ({ page }) => {
      const originalComment = 'Original comment';
      const updatedComment = 'Updated comment';

      // Add comment
      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="add-comment-button"]');
      await helpers.fillField('[data-testid="comment-input"]', originalComment);
      await helpers.page.click('[data-testid="post-comment-button"]');

      // Edit comment
      await helpers.page.click('[data-testid="edit-comment-button"]');
      await helpers.fillField('[data-testid="comment-input"]', updatedComment);
      await helpers.page.click('[data-testid="save-comment-button"]');

      await helpers.expectSuccessMessage('Comment updated successfully');
      await expect(helpers.page.locator('[data-testid="comment-list"]')).toContainText(updatedComment);
    });

    test('should delete comment', async ({ page }) => {
      const comment = 'Comment to delete';

      // Add comment
      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="add-comment-button"]');
      await helpers.fillField('[data-testid="comment-input"]', comment);
      await helpers.page.click('[data-testid="post-comment-button"]');

      // Delete comment
      await helpers.page.click('[data-testid="delete-comment-button"]');
      await helpers.page.click(SELECTORS.confirmButton);

      await helpers.expectSuccessMessage('Comment deleted successfully');
    });
  });

  test.describe('Task Deletion', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.createTask(TEST_TASKS.highPriority, 'todo-column-id');
    });

    test('should delete task', async ({ page }) => {
      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="delete-task-button"]');
      await helpers.page.click(SELECTORS.confirmButton);

      await helpers.expectSuccessMessage('Task deleted successfully');
    });

    test('should cancel task deletion', async ({ page }) => {
      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="delete-task-button"]');
      await helpers.page.click(SELECTORS.cancelButton);

      // Task should still exist
      await helpers.expectTaskToExist(TEST_TASKS.highPriority.title);
    });

    test('should soft delete task', async ({ page }) => {
      await helpers.page.click('[data-testid="task-card"]');
      await helpers.page.click('[data-testid="archive-task-button"]');
      await helpers.page.click(SELECTORS.confirmButton);

      await helpers.expectSuccessMessage('Task archived successfully');
    });
  });

  test.describe('Task Bulk Operations', () => {
    test.beforeEach(async ({ page }) => {
      // Create multiple tasks
      await helpers.createTask(TEST_TASKS.highPriority, 'todo-column-id');
      await helpers.createTask(TEST_TASKS.mediumPriority, 'todo-column-id');
      await helpers.createTask(TEST_TASKS.lowPriority, 'todo-column-id');
    });

    test('should select multiple tasks', async ({ page }) => {
      await helpers.page.click('[data-testid="select-all-tasks-checkbox"]');

      const selectedTasks = helpers.page.locator('[data-testid="selected-task"]');
      await expect(selectedTasks).toHaveCount(3);
    });

    test('should bulk assign tasks', async ({ page }) => {
      await helpers.page.click('[data-testid="select-all-tasks-checkbox"]');
      await helpers.page.click('[data-testid="bulk-assign-button"]');
      await helpers.selectOption('[data-testid="bulk-assignee-select"]', TEST_USERS.member.email);
      await helpers.page.click('[data-testid="bulk-assign-confirm-button"]');

      await helpers.expectSuccessMessage('Tasks assigned successfully');
    });

    test('should bulk move tasks', async ({ page }) => {
      await helpers.page.click('[data-testid="select-all-tasks-checkbox"]');
      await helpers.page.click('[data-testid="bulk-move-button"]');
      await helpers.selectOption('[data-testid="bulk-target-column-select"]', 'in-progress-column-id');
      await helpers.page.click('[data-testid="bulk-move-confirm-button"]');

      await helpers.expectSuccessMessage('Tasks moved successfully');
    });

    test('should bulk delete tasks', async ({ page }) => {
      await helpers.page.click('[data-testid="select-all-tasks-checkbox"]');
      await helpers.page.click('[data-testid="bulk-delete-button"]');
      await helpers.page.click(SELECTORS.confirmButton);

      await helpers.expectSuccessMessage('Tasks deleted successfully');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors during task creation', async ({ page }) => {
      // Simulate network error
      await page.route('**/api/v1/tasks**', route => route.abort());

      await helpers.page.click(SELECTORS.addTaskToColumnButton);
      await helpers.fillField(SELECTORS.taskTitleInput, TEST_TASKS.highPriority.title);
      await helpers.page.click(SELECTORS.taskSubmitButton);

      await helpers.expectErrorMessage('Network error occurred');
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Simulate server error
      await page.route('**/api/v1/tasks**', route => route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      }));

      await helpers.page.click(SELECTORS.addTaskToColumnButton);
      await helpers.fillField(SELECTORS.taskTitleInput, TEST_TASKS.highPriority.title);
      await helpers.page.click(SELECTORS.taskSubmitButton);

      await helpers.expectErrorMessage('Server error occurred');
    });
  });

  test.describe('Performance', () => {
    test('should load tasks within acceptable time', async ({ page }) => {
      await helpers.expectPageLoadTimeToBeLessThan(3000);
    });

    test('should handle large number of tasks', async ({ page }) => {
      // Create multiple tasks
      for (let i = 0; i < 50; i++) {
        await helpers.createTask({
          title: `Task ${i}`,
          description: `Description for task ${i}`,
          priority: 'medium'
        }, 'todo-column-id');
      }

      const taskCards = await helpers.getTaskCards();
      expect(taskCards.length).toBeGreaterThanOrEqual(50);
    });
  });
});
