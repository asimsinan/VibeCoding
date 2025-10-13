import { test, expect } from '@playwright/test';

test.describe('Course Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - in a real scenario, this would be actual login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'instructor@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/instructor/dashboard');
  });

  test('should display instructor dashboard', async ({ page }) => {
    await expect(page).toHaveTitle(/Dashboard/);
    await expect(page.locator('text=My Courses')).toBeVisible();
    await expect(page.locator('text=Create New Course')).toBeVisible();
  });

  test('should navigate to course creation', async ({ page }) => {
    await page.click('text=Create New Course');
    await expect(page).toHaveURL('/instructor/courses/new');
    
    // Verify course creation form
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('select[name="status"]')).toBeVisible();
  });

  test('should create a new course', async ({ page }) => {
    await page.goto('/instructor/courses/new');
    
    // Fill course form
    await page.fill('input[name="title"]', 'Test Course E2E');
    await page.fill('textarea[name="description"]', 'This is a test course created during E2E testing');
    await page.selectOption('select[name="status"]', 'DRAFT');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success message or redirect
    await expect(page.locator('text=Course created successfully')).toBeVisible();
  });

  test('should validate course creation form', async ({ page }) => {
    await page.goto('/instructor/courses/new');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=Description is required')).toBeVisible();
  });

  test('should display course list', async ({ page }) => {
    await page.goto('/instructor/courses');
    
    // Verify course list page elements
    await expect(page.locator('text=My Courses')).toBeVisible();
    await expect(page.locator('text=Create New Course')).toBeVisible();
    
    // Check for course table/list
    await expect(page.locator('table, .course-list')).toBeVisible();
  });

  test('should edit existing course', async ({ page }) => {
    await page.goto('/instructor/courses');
    
    // Click edit button on first course (if any exist)
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Verify edit form
      await expect(page.locator('input[name="title"]')).toBeVisible();
      await expect(page.locator('textarea[name="description"]')).toBeVisible();
      
      // Modify course title
      await page.fill('input[name="title"]', 'Updated Course Title');
      await page.click('button[type="submit"]');
      
      // Verify success
      await expect(page.locator('text=Course updated successfully')).toBeVisible();
    }
  });

  test('should delete course with confirmation', async ({ page }) => {
    await page.goto('/instructor/courses');
    
    // Click delete button on first course (if any exist)
    const deleteButton = page.locator('button:has-text("Delete")').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Verify confirmation dialog
      await expect(page.locator('text=Are you sure you want to delete this course?')).toBeVisible();
      
      // Confirm deletion
      await page.click('button:has-text("Confirm")');
      
      // Verify success message
      await expect(page.locator('text=Course deleted successfully')).toBeVisible();
    }
  });
});

test.describe('Student Course Catalog', () => {
  test.beforeEach(async ({ page }) => {
    // Mock student authentication
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'student@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/student/dashboard');
  });

  test('should display course catalog', async ({ page }) => {
    await page.goto('/student/catalog');
    
    await expect(page).toHaveTitle(/Course Catalog/);
    await expect(page.locator('text=Available Courses')).toBeVisible();
    
    // Check for course cards/list
    await expect(page.locator('.course-card, .course-item')).toBeVisible();
  });

  test('should filter courses by status', async ({ page }) => {
    await page.goto('/student/catalog');
    
    // Test filter functionality
    const filterSelect = page.locator('select[name="status"]');
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('PUBLISHED');
      
      // Verify filter is applied
      await expect(page.locator('.course-card')).toBeVisible();
    }
  });

  test('should search courses', async ({ page }) => {
    await page.goto('/student/catalog');
    
    // Test search functionality
    const searchInput = page.locator('input[name="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.keyboard.press('Enter');
      
      // Verify search results
      await expect(page.locator('.course-card')).toBeVisible();
    }
  });

  test('should enroll in course', async ({ page }) => {
    await page.goto('/student/catalog');
    
    // Click enroll button on first course
    const enrollButton = page.locator('button:has-text("Enroll")').first();
    if (await enrollButton.isVisible()) {
      await enrollButton.click();
      
      // Verify enrollment success
      await expect(page.locator('text=Successfully enrolled in course')).toBeVisible();
    }
  });
});
