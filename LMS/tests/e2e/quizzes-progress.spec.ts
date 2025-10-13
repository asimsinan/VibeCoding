import { test, expect } from '@playwright/test';

test.describe('Quiz Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock instructor authentication
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'instructor@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/instructor/dashboard');
  });

  test('should create a new quiz', async ({ page }) => {
    await page.goto('/instructor/quizzes/new');
    
    // Fill quiz form
    await page.fill('input[name="title"]', 'Test Quiz E2E');
    await page.fill('textarea[name="description"]', 'This is a test quiz created during E2E testing');
    await page.selectOption('select[name="lessonId"]', '1'); // Assuming lesson ID 1 exists
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('text=Quiz created successfully')).toBeVisible();
  });

  test('should add questions to quiz', async ({ page }) => {
    await page.goto('/instructor/quizzes');
    
    // Click on a quiz to edit it
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Navigate to questions tab
      await page.click('text=Questions');
      
      // Add new question
      await page.click('button:has-text("Add Question")');
      
      // Fill question form
      await page.fill('textarea[name="question"]', 'What is the capital of France?');
      await page.fill('input[name="options[0]"]', 'Paris');
      await page.fill('input[name="options[1]"]', 'London');
      await page.fill('input[name="options[2]"]', 'Berlin');
      await page.fill('input[name="options[3]"]', 'Madrid');
      await page.check('input[name="correctAnswer"][value="0"]');
      
      // Save question
      await page.click('button:has-text("Save Question")');
      
      // Verify question was added
      await expect(page.locator('text=What is the capital of France?')).toBeVisible();
    }
  });

  test('should validate quiz creation form', async ({ page }) => {
    await page.goto('/instructor/quizzes/new');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=Description is required')).toBeVisible();
    await expect(page.locator('text=Lesson is required')).toBeVisible();
  });
});

test.describe('Student Quiz Taking', () => {
  test.beforeEach(async ({ page }) => {
    // Mock student authentication
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'student@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/student/dashboard');
  });

  test('should take a quiz', async ({ page }) => {
    await page.goto('/student/quizzes');
    
    // Click on a quiz to take it
    const takeQuizButton = page.locator('button:has-text("Take Quiz")').first();
    if (await takeQuizButton.isVisible()) {
      await takeQuizButton.click();
      
      // Verify quiz interface
      await expect(page.locator('text=Quiz:')).toBeVisible();
      await expect(page.locator('.question')).toBeVisible();
      await expect(page.locator('button:has-text("Next")')).toBeVisible();
    }
  });

  test('should answer quiz questions', async ({ page }) => {
    await page.goto('/student/quizzes');
    
    const takeQuizButton = page.locator('button:has-text("Take Quiz")').first();
    if (await takeQuizButton.isVisible()) {
      await takeQuizButton.click();
      
      // Answer first question
      const firstOption = page.locator('input[type="radio"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.check();
        
        // Navigate to next question
        await page.click('button:has-text("Next")');
        
        // Answer second question
        const secondOption = page.locator('input[type="radio"]').first();
        if (await secondOption.isVisible()) {
          await secondOption.check();
        }
      }
    }
  });

  test('should submit quiz and view results', async ({ page }) => {
    await page.goto('/student/quizzes');
    
    const takeQuizButton = page.locator('button:has-text("Take Quiz")').first();
    if (await takeQuizButton.isVisible()) {
      await takeQuizButton.click();
      
      // Answer all questions (simplified)
      const options = page.locator('input[type="radio"]');
      const count = await options.count();
      
      for (let i = 0; i < count; i++) {
        await options.nth(i).check();
        if (i < count - 1) {
          await page.click('button:has-text("Next")');
        }
      }
      
      // Submit quiz
      await page.click('button:has-text("Submit Quiz")');
      
      // Verify results page
      await expect(page.locator('text=Quiz Results')).toBeVisible();
      await expect(page.locator('text=Score:')).toBeVisible();
    }
  });
});

test.describe('Progress Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Mock student authentication
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'student@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/student/dashboard');
  });

  test('should display progress dashboard', async ({ page }) => {
    await page.goto('/student/progress');
    
    await expect(page).toHaveTitle(/Progress/);
    await expect(page.locator('text=My Progress')).toBeVisible();
    
    // Check for progress indicators
    await expect(page.locator('.progress-bar, .progress-circle')).toBeVisible();
  });

  test('should show course progress', async ({ page }) => {
    await page.goto('/student/progress');
    
    // Verify course progress is displayed
    await expect(page.locator('.course-progress')).toBeVisible();
    
    // Check for progress percentages
    await expect(page.locator('text=%')).toBeVisible();
  });

  test('should mark lesson as complete', async ({ page }) => {
    await page.goto('/student/courses');
    
    // Click on a course
    const courseLink = page.locator('.course-card a').first();
    if (await courseLink.isVisible()) {
      await courseLink.click();
      
      // Navigate to a lesson
      const lessonLink = page.locator('.lesson-item a').first();
      if (await lessonLink.isVisible()) {
        await lessonLink.click();
        
        // Mark lesson as complete
        const completeButton = page.locator('button:has-text("Mark Complete")');
        if (await completeButton.isVisible()) {
          await completeButton.click();
          
          // Verify success
          await expect(page.locator('text=Lesson marked as complete')).toBeVisible();
        }
      }
    }
  });

  test('should display certificates', async ({ page }) => {
    await page.goto('/student/certificates');
    
    await expect(page).toHaveTitle(/Certificates/);
    await expect(page.locator('text=My Certificates')).toBeVisible();
    
    // Check for certificate cards
    await expect(page.locator('.certificate-card')).toBeVisible();
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/admin/dashboard');
  });

  test('should display admin dashboard', async ({ page }) => {
    await expect(page).toHaveTitle(/Admin Dashboard/);
    await expect(page.locator('text=System Overview')).toBeVisible();
    
    // Check for admin-specific elements
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
  });

  test('should manage users', async ({ page }) => {
    await page.goto('/admin/users');
    
    await expect(page).toHaveTitle(/User Management/);
    await expect(page.locator('text=All Users')).toBeVisible();
    
    // Check for user table
    await expect(page.locator('table')).toBeVisible();
    
    // Test user creation
    await page.click('button:has-text("Add User")');
    await expect(page.locator('text=Create New User')).toBeVisible();
  });

  test('should view analytics', async ({ page }) => {
    await page.goto('/admin/analytics');
    
    await expect(page).toHaveTitle(/Analytics/);
    await expect(page.locator('text=System Analytics')).toBeVisible();
    
    // Check for charts/graphs
    await expect(page.locator('.chart, .graph')).toBeVisible();
  });
});
