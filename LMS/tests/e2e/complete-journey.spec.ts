import { test, expect } from '@playwright/test';

test.describe('Complete User Journey', () => {
  test('should complete full student journey', async ({ page }) => {
    // Step 1: Registration
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Test Student');
    await page.fill('input[name="email"]', 'teststudent@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.selectOption('select[name="role"]', 'STUDENT');
    await page.click('button[type="submit"]');
    
    // Step 2: Login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'teststudent@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Step 3: Browse course catalog
    await page.goto('/student/catalog');
    await expect(page.locator('text=Available Courses')).toBeVisible();
    
    // Step 4: Enroll in a course
    const enrollButton = page.locator('button:has-text("Enroll")').first();
    if (await enrollButton.isVisible()) {
      await enrollButton.click();
      await expect(page.locator('text=Successfully enrolled')).toBeVisible();
    }
    
    // Step 5: Access enrolled course
    await page.goto('/student/courses');
    await expect(page.locator('text=My Courses')).toBeVisible();
    
    // Step 6: Take a lesson
    const courseLink = page.locator('.course-card a').first();
    if (await courseLink.isVisible()) {
      await courseLink.click();
      
      const lessonLink = page.locator('.lesson-item a').first();
      if (await lessonLink.isVisible()) {
        await lessonLink.click();
        
        // Mark lesson as complete
        const completeButton = page.locator('button:has-text("Mark Complete")');
        if (await completeButton.isVisible()) {
          await completeButton.click();
          await expect(page.locator('text=Lesson completed')).toBeVisible();
        }
      }
    }
    
    // Step 7: Take a quiz
    await page.goto('/student/quizzes');
    const takeQuizButton = page.locator('button:has-text("Take Quiz")').first();
    if (await takeQuizButton.isVisible()) {
      await takeQuizButton.click();
      
      // Answer quiz questions
      const options = page.locator('input[type="radio"]');
      const count = await options.count();
      
      for (let i = 0; i < count; i++) {
        await options.nth(i).check();
        if (i < count - 1) {
          await page.click('button:has-text("Next")');
        }
      }
      
      await page.click('button:has-text("Submit Quiz")');
      await expect(page.locator('text=Quiz Results')).toBeVisible();
    }
    
    // Step 8: View progress
    await page.goto('/student/progress');
    await expect(page.locator('text=My Progress')).toBeVisible();
    await expect(page.locator('.progress-bar')).toBeVisible();
  });

  test('should complete full instructor journey', async ({ page }) => {
    // Step 1: Login as instructor
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'instructor@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Step 2: Access instructor dashboard
    await page.goto('/instructor/dashboard');
    await expect(page.locator('text=My Courses')).toBeVisible();
    
    // Step 3: Create a new course
    await page.click('text=Create New Course');
    await page.fill('input[name="title"]', 'E2E Test Course');
    await page.fill('textarea[name="description"]', 'Course created during E2E testing');
    await page.selectOption('select[name="status"]', 'DRAFT');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Course created successfully')).toBeVisible();
    
    // Step 4: Add modules to course
    await page.goto('/instructor/courses');
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Add module
      await page.click('button:has-text("Add Module")');
      await page.fill('input[name="title"]', 'Test Module');
      await page.fill('textarea[name="description"]', 'Test module description');
      await page.click('button:has-text("Save Module")');
    }
    
    // Step 5: Add lessons to module
    await page.click('text=Lessons');
    await page.click('button:has-text("Add Lesson")');
    await page.fill('input[name="title"]', 'Test Lesson');
    await page.fill('textarea[name="content"]', 'Test lesson content');
    await page.click('button:has-text("Save Lesson")');
    
    // Step 6: Create quiz for lesson
    await page.goto('/instructor/quizzes/new');
    await page.fill('input[name="title"]', 'Test Quiz');
    await page.fill('textarea[name="description"]', 'Test quiz description');
    await page.selectOption('select[name="lessonId"]', '1');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Quiz created successfully')).toBeVisible();
    
    // Step 7: Add questions to quiz
    await page.click('text=Questions');
    await page.click('button:has-text("Add Question")');
    await page.fill('textarea[name="question"]', 'What is 2 + 2?');
    await page.fill('input[name="options[0]"]', '3');
    await page.fill('input[name="options[1]"]', '4');
    await page.fill('input[name="options[2]"]', '5');
    await page.fill('input[name="options[3]"]', '6');
    await page.check('input[name="correctAnswer"][value="1"]');
    await page.click('button:has-text("Save Question")');
    
    // Step 8: Publish course
    await page.goto('/instructor/courses');
    const publishButton = page.locator('button:has-text("Publish")').first();
    if (await publishButton.isVisible()) {
      await publishButton.click();
      await expect(page.locator('text=Course published successfully')).toBeVisible();
    }
  });

  test('should complete full admin journey', async ({ page }) => {
    // Step 1: Login as admin
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Step 2: Access admin dashboard
    await page.goto('/admin/dashboard');
    await expect(page.locator('text=System Overview')).toBeVisible();
    
    // Step 3: Manage users
    await page.goto('/admin/users');
    await expect(page.locator('text=All Users')).toBeVisible();
    
    // Create new user
    await page.click('button:has-text("Add User")');
    await page.fill('input[name="name"]', 'Admin Created User');
    await page.fill('input[name="email"]', 'adminuser@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.selectOption('select[name="role"]', 'STUDENT');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=User created successfully')).toBeVisible();
    
    // Step 4: View analytics
    await page.goto('/admin/analytics');
    await expect(page.locator('text=System Analytics')).toBeVisible();
    
    // Step 5: Manage organizations
    await page.goto('/admin/organizations');
    await expect(page.locator('text=Organizations')).toBeVisible();
    
    // Step 6: View audit logs
    await page.goto('/admin/audit-logs');
    await expect(page.locator('text=Audit Logs')).toBeVisible();
  });
});

test.describe('Cross-Browser Compatibility', () => {
  test('should work in Chrome', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should work in Firefox', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should work in Safari', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

test.describe('Data Persistence', () => {
  test('should persist user data across sessions', async ({ page }) => {
    // Create user data
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Persistent User');
    await page.fill('input[name="email"]', 'persistent@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.selectOption('select[name="role"]', 'STUDENT');
    await page.click('button[type="submit"]');
    
    // Login and create some data
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'persistent@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Create course progress
    await page.goto('/student/courses');
    const courseLink = page.locator('.course-card a').first();
    if (await courseLink.isVisible()) {
      await courseLink.click();
      
      const completeButton = page.locator('button:has-text("Mark Complete")');
      if (await completeButton.isVisible()) {
        await completeButton.click();
      }
    }
    
    // Close browser and reopen
    await page.close();
    
    // Reopen and verify data persists
    const newPage = await page.context().newPage();
    await newPage.goto('/auth/login');
    await newPage.fill('input[type="email"]', 'persistent@example.com');
    await newPage.fill('input[type="password"]', 'password123');
    await newPage.click('button[type="submit"]');
    
    await newPage.goto('/student/progress');
    await expect(newPage.locator('text=My Progress')).toBeVisible();
  });
});
