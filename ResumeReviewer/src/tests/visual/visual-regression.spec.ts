import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('Main page visual regression - desktop', async ({ page }) => {
    // Take full page screenshot
    await expect(page).toHaveScreenshot('main-page-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Main page visual regression - mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('main-page-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('File upload component visual regression', async ({ page }) => {
    // Focus on the upload section
    const uploadSection = page.locator('[data-testid="upload-section"]').first();
    
    if (await uploadSection.isVisible()) {
      await expect(uploadSection).toHaveScreenshot('file-upload-component.png', {
        animations: 'disabled',
      });
    } else {
      // If no specific test ID, take screenshot of the main card
      const mainCard = page.locator('div').filter({ hasText: 'Upload Your Resume' }).first();
      await expect(mainCard).toHaveScreenshot('file-upload-component.png', {
        animations: 'disabled',
      });
    }
  });

  test('Header section visual regression', async ({ page }) => {
    // Focus on the header section
    const header = page.locator('h1').filter({ hasText: 'AI Resume Reviewer' }).first();
    
    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot('header-section.png', {
        animations: 'disabled',
      });
    }
  });

  test('Features section visual regression', async ({ page }) => {
    // Scroll to features section
    await page.evaluate(() => {
      const featuresSection = document.querySelector('h2');
      if (featuresSection) {
        featuresSection.scrollIntoView();
      }
    });
    
    await page.waitForTimeout(500); // Wait for scroll animation
    
    // Take screenshot of features section
    const featuresSection = page.locator('h2').filter({ hasText: 'Why Choose Our Resume Reviewer?' }).first();
    
    if (await featuresSection.isVisible()) {
      await expect(featuresSection).toHaveScreenshot('features-section.png', {
        animations: 'disabled',
      });
    }
  });

  test('Button components visual regression', async ({ page }) => {
    // Find all buttons and take screenshots
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Take screenshot of the first button
      const firstButton = buttons.first();
      await expect(firstButton).toHaveScreenshot('button-component.png', {
        animations: 'disabled',
      });
    }
  });

  test('Card components visual regression', async ({ page }) => {
    // Find all cards and take screenshots
    const cards = page.locator('[class*="card"], [class*="Card"]');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      // Take screenshot of the first card
      const firstCard = cards.first();
      await expect(firstCard).toHaveScreenshot('card-component.png', {
        animations: 'disabled',
      });
    }
  });

  test('Responsive design visual regression', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-large' },
      { width: 1024, height: 768, name: 'desktop-small' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(200); // Wait for layout to adjust
      
      await expect(page).toHaveScreenshot(`responsive-${viewport.name}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('Dark mode visual regression', async ({ page }) => {
    // Check if dark mode is available
    const body = page.locator('body');
    const hasDarkMode = await body.evaluate((el) => {
      return el.classList.contains('dark') || 
             getComputedStyle(el).getPropertyValue('--dark-mode') !== '';
    });

    if (hasDarkMode) {
      // Toggle dark mode if available
      await page.evaluate(() => {
        const toggle = document.querySelector('[data-testid="dark-mode-toggle"]');
        if (toggle) {
          (toggle as HTMLElement).click();
        }
      });
      
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('main-page-dark-mode.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('Loading states visual regression', async ({ page }) => {
    // Simulate file upload to test loading states
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.isVisible()) {
      // Create a test file
      const testFile = new File(['test content'], 'test-resume.pdf', { type: 'application/pdf' });
      
      // Upload file
      await fileInput.setInputFiles({
        name: 'test-resume.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('test content')
      });
      
      // Wait for upload button to appear
      const uploadButton = page.locator('button').filter({ hasText: 'Analyze Resume' });
      if (await uploadButton.isVisible()) {
        await uploadButton.click();
        
        // Wait for loading state
        await page.waitForTimeout(1000);
        
        // Take screenshot of loading state
        await expect(page).toHaveScreenshot('loading-state.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    }
  });

  test('Error states visual regression', async ({ page }) => {
    // Test error handling by uploading invalid file
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.isVisible()) {
      // Upload invalid file type
      await fileInput.setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('test content')
      });
      
      // Try to upload
      const uploadButton = page.locator('button').filter({ hasText: 'Analyze Resume' });
      if (await uploadButton.isVisible()) {
        await uploadButton.click();
        
        // Wait for error to appear
        await page.waitForTimeout(2000);
        
        // Take screenshot of error state
        await expect(page).toHaveScreenshot('error-state.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    }
  });
});
