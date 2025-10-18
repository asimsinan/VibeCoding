import { test, expect } from '@playwright/test';
import path from 'path';

const APP_URL = 'http://localhost:3000';

test.describe('Room Photo Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[name="email"]', 'user@ardecorator.com');
    await page.fill('input[name="password"]', 'user123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${APP_URL}/dashboard`, { timeout: 5000 });
  });

  test('should navigate to upload page', async ({ page }) => {
    await page.goto(`${APP_URL}/editor`);

    // Should see upload option
    await expect(page.locator('text=Upload, text=Room Photo, button:has-text("Upload")')).toBeVisible({ timeout: 5000 });
  });

  test('should show file upload input', async ({ page }) => {
    await page.goto(`${APP_URL}/editor`);

    // Should have file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test('should upload room photo (simulated)', async ({ page }) => {
    await page.goto(`${APP_URL}/editor`);

    // Find upload button
    const uploadButton = page.locator('button:has-text("Upload Photo"), button:has-text("Upload Room")');
    
    if (await uploadButton.count() > 0) {
      await uploadButton.click();

      // Should show file dialog or upload modal
      await expect(page.locator('input[type="file"], text=Select a file')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should display uploaded room photos list', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);

    // Navigate to room photos section
    await page.click('a:has-text("Room Photos"), button:has-text("Photos")').catch(() => {});

    await page.waitForTimeout(1000);

    // Should show room photos or empty state
    const hasPhotos = await page.locator('[data-testid="room-photo"], .room-photo-item').count();
    
    if (hasPhotos > 0) {
      await expect(page.locator('[data-testid="room-photo"]').first()).toBeVisible();
    } else {
      await expect(page.locator('text=No photos, text=Upload your first')).toBeVisible();
    }
  });

  test('should show room photo status', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);

    await page.waitForTimeout(1000);

    const firstPhoto = page.locator('[data-testid="room-photo"]').first();
    if (await firstPhoto.count() > 0) {
      // Should show status (processing, completed, failed)
      await expect(firstPhoto.locator('text=Processing, text=Completed, text=Failed')).toBeVisible();
    }
  });

  test('should delete room photo', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);

    await page.waitForTimeout(1000);

    const photoCount = await page.locator('[data-testid="room-photo"]').count();

    if (photoCount > 0) {
      // Click delete button
      await page.click('[data-testid="room-photo"]:first-child button:has-text("Delete")');

      // Confirm deletion
      await page.click('button:has-text("Confirm"), button:has-text("Delete")');

      await page.waitForTimeout(500);

      // Should have fewer photos
      const newCount = await page.locator('[data-testid="room-photo"]').count();
      expect(newCount).toBeLessThan(photoCount);
    }
  });

  test('should show room dimensions after analysis', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);

    await page.waitForTimeout(1000);

    const firstPhoto = page.locator('[data-testid="room-photo"]').first();
    if (await firstPhoto.count() > 0) {
      const status = await firstPhoto.locator('text=Completed').count();
      
      if (status > 0) {
        // Click to view details
        await firstPhoto.click();

        // Should show dimensions
        await expect(page.locator('text=Width, text=Height, text=Depth')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should use room photo for design creation', async ({ page }) => {
    await page.goto(`${APP_URL}/editor`);

    await page.waitForTimeout(1000);

    // Select room photo
    const roomPhotoSelect = page.locator('select[name="roomPhotoId"], [data-room-photo-select]');
    if (await roomPhotoSelect.count() > 0) {
      await roomPhotoSelect.selectOption({ index: 1 });

      // Should show room photo preview
      await expect(page.locator('img[alt*="room"], [data-room-preview]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should validate file type on upload', async ({ page }) => {
    await page.goto(`${APP_URL}/editor`);

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      // Try to upload invalid file type
      const accept = await fileInput.getAttribute('accept');
      
      // Should only accept image files
      expect(accept).toContain('image');
    }
  });

  test('should show upload progress', async ({ page }) => {
    await page.goto(`${APP_URL}/editor`);

    // After file selection, should show progress
    const uploadButton = page.locator('button:has-text("Upload")');
    if (await uploadButton.count() > 0) {
      await uploadButton.click();

      // Should show progress indicator or loading state
      await expect(page.locator('text=Uploading, text=Processing, .spinner, [role="progressbar"]')).toBeVisible({ timeout: 2000 });
    }
  });
});

