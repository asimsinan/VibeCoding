import { test, expect } from '@playwright/test';

/**
 * E2E Tests for PDF Download Functionality
 * 
 * These tests verify the complete PDF download workflow
 * including user interactions and cross-browser compatibility.
 */

test.describe('PDF Download E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('PDF Download Workflow', () => {
    test('should download PDF with complete invoice data', async ({ page }) => {
      // Fill client details
      await page.fill('[data-testid="client-name"]', 'Acme Corporation');
      await page.fill('[data-testid="client-email"]', 'billing@acmecorp.com');
      await page.fill('[data-testid="client-address"]', '123 Business Ave, Suite 100, New York, NY 10001');
      await page.fill('[data-testid="client-phone"]', '+1-555-123-4567');

      // Add line items
      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-0"]', 'Web Development Services');
      await page.fill('[data-testid="line-item-quantity-0"]', '40');
      await page.fill('[data-testid="line-item-unit-price-0"]', '125.00');

      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-1"]', 'UI/UX Design');
      await page.fill('[data-testid="line-item-quantity-1"]', '20');
      await page.fill('[data-testid="line-item-unit-price-1"]', '100.00');

      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-2"]', 'Project Management');
      await page.fill('[data-testid="line-item-quantity-2"]', '10');
      await page.fill('[data-testid="line-item-unit-price-2"]', '150.00');

      // Set tax rate
      await page.fill('[data-testid="tax-rate"]', '8.5');

      // Verify calculations
      await expect(page.locator('[data-testid="subtotal"]')).toContainText('$8,500.00'); // 40*125 + 20*100 + 10*150 = 8500
      await expect(page.locator('[data-testid="tax-amount"]')).toContainText('$722.50'); // 8500 * 0.085 = 722.50
      await expect(page.locator('[data-testid="total"]')).toContainText('$9,222.50'); // 8500 + 722.50 = 9222.50

      // Download PDF
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf"]');
      const download = await downloadPromise;

      // Verify download
      expect(download.suggestedFilename()).toMatch(/invoice.*\.(pdf|json)$/i);
      expect(download.url()).toContain('blob:');
    });

    test('should handle PDF download with minimal invoice data', async ({ page }) => {
      // Fill minimal client details
      await page.fill('[data-testid="client-name"]', 'Minimal Client');
      await page.fill('[data-testid="client-email"]', 'minimal@example.com');
      await page.fill('[data-testid="client-address"]', '123 Simple St');
      await page.fill('[data-testid="client-phone"]', '555-0000');

      // Add single line item
      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-0"]', 'Basic Service');
      await page.fill('[data-testid="line-item-quantity-0"]', '1');
      await page.fill('[data-testid="line-item-unit-price-0"]', '50.00');

      // No tax
      await page.fill('[data-testid="tax-rate"]', '0');

      // Verify calculations
      await expect(page.locator('[data-testid="subtotal"]')).toContainText('$50.00');
      await expect(page.locator('[data-testid="tax-amount"]')).toContainText('$0.00');
      await expect(page.locator('[data-testid="total"]')).toContainText('$50.00');

      // Download PDF
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf"]');
      const download = await downloadPromise;

      // Verify download
      expect(download.suggestedFilename()).toMatch(/invoice.*\.(pdf|json)$/i);
      expect(download.url()).toContain('blob:');
    });

    test('should handle PDF download with large invoice', async ({ page }) => {
      // Fill client details
      await page.fill('[data-testid="client-name"]', 'Large Corporation Inc');
      await page.fill('[data-testid="client-email"]', 'billing@largecorp.com');
      await page.fill('[data-testid="client-address"]', '456 Corporate Blvd, Suite 2000, Metropolis, NY 10002');
      await page.fill('[data-testid="client-phone"]', '+1-555-999-8888');

      // Add many line items
      for (let i = 0; i < 20; i++) {
        await page.click('[data-testid="add-line-item"]');
        await page.fill(`[data-testid="line-item-description-${i}"]`, `Service Item ${i + 1}`);
        await page.fill(`[data-testid="line-item-quantity-${i}"]`, '1');
        await page.fill(`[data-testid="line-item-unit-price-${i}"]`, '25.00');
      }

      // Set tax rate
      await page.fill('[data-testid="tax-rate"]', '10');

      // Verify calculations
      await expect(page.locator('[data-testid="subtotal"]')).toContainText('$500.00'); // 20 * 25 = 500
      await expect(page.locator('[data-testid="tax-amount"]')).toContainText('$50.00'); // 500 * 0.10 = 50
      await expect(page.locator('[data-testid="total"]')).toContainText('$550.00'); // 500 + 50 = 550

      // Download PDF
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf"]');
      const download = await downloadPromise;

      // Verify download
      expect(download.suggestedFilename()).toMatch(/invoice.*\.(pdf|json)$/i);
      expect(download.url()).toContain('blob:');
    });
  });

  test.describe('File Naming Tests', () => {
    test('should generate appropriate filename with current date', async ({ page }) => {
      // Fill invoice data
      await page.fill('[data-testid="client-name"]', 'Filename Test Client');
      await page.fill('[data-testid="client-email"]', 'filename@test.com');
      await page.fill('[data-testid="client-address"]', '123 Test St');
      await page.fill('[data-testid="client-phone"]', '555-1234');

      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-0"]', 'Test Service');
      await page.fill('[data-testid="line-item-quantity-0"]', '1');
      await page.fill('[data-testid="line-item-unit-price-0"]', '100.00');

      // Download PDF
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf"]');
      const download = await downloadPromise;

      // Verify filename format
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/^invoice.*\.(pdf|json)$/i);
      expect(filename.length).toBeGreaterThan(10);
    });

    test('should handle special characters in client name for filename', async ({ page }) => {
      // Fill invoice data with special characters
      await page.fill('[data-testid="client-name"]', 'Client & Co. (Ltd.)');
      await page.fill('[data-testid="client-email"]', 'special@test.com');
      await page.fill('[data-testid="client-address"]', '123 Special St');
      await page.fill('[data-testid="client-phone"]', '555-1234');

      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-0"]', 'Special Service');
      await page.fill('[data-testid="line-item-quantity-0"]', '1');
      await page.fill('[data-testid="line-item-unit-price-0"]', '100.00');

      // Download PDF
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf"]');
      const download = await downloadPromise;

      // Verify filename is valid
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/^invoice.*\.(pdf|json)$/i);
      expect(filename).not.toContain('&');
      expect(filename).not.toContain('(');
      expect(filename).not.toContain(')');
    });
  });

  test.describe('Error Handling Tests', () => {
    test('should show error when trying to download without required fields', async ({ page }) => {
      // Try to download without filling any fields
      await page.click('[data-testid="download-pdf"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="client-name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="line-items-error"]')).toBeVisible();
    });

    test('should show error when trying to download with invalid data', async ({ page }) => {
      // Fill with invalid data
      await page.fill('[data-testid="client-name"]', 'Test Client');
      await page.fill('[data-testid="client-email"]', 'invalid-email');
      await page.fill('[data-testid="client-address"]', '123 Test St');
      await page.fill('[data-testid="client-phone"]', '555-1234');

      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-0"]', 'Test Service');
      await page.fill('[data-testid="line-item-quantity-0"]', '-1'); // Invalid quantity
      await page.fill('[data-testid="line-item-unit-price-0"]', '100.00');

      await page.click('[data-testid="download-pdf"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="client-email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="line-item-quantity-error-0"]')).toBeVisible();
    });

    test('should handle network errors during PDF generation', async ({ page }) => {
      // Fill valid data
      await page.fill('[data-testid="client-name"]', 'Network Error Client');
      await page.fill('[data-testid="client-email"]', 'network@test.com');
      await page.fill('[data-testid="client-address"]', '123 Network St');
      await page.fill('[data-testid="client-phone"]', '555-1234');

      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-0"]', 'Network Service');
      await page.fill('[data-testid="line-item-quantity-0"]', '1');
      await page.fill('[data-testid="line-item-unit-price-0"]', '100.00');

      // Try to download (this should trigger network error in our mock)
      await page.click('[data-testid="download-pdf"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to generate PDF');
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work in Chrome', async ({ page, browserName }) => {
      if (browserName !== 'chromium') return;

      await page.fill('[data-testid="client-name"]', 'Chrome Test Client');
      await page.fill('[data-testid="client-email"]', 'chrome@test.com');
      await page.fill('[data-testid="client-address"]', '123 Chrome St');
      await page.fill('[data-testid="client-phone"]', '555-1234');

      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-0"]', 'Chrome Service');
      await page.fill('[data-testid="line-item-quantity-0"]', '1');
      await page.fill('[data-testid="line-item-unit-price-0"]', '100.00');

      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf"]');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/invoice.*\.(pdf|json)$/i);
    });

    test('should work in Firefox', async ({ page, browserName }) => {
      if (browserName !== 'firefox') return;

      await page.fill('[data-testid="client-name"]', 'Firefox Test Client');
      await page.fill('[data-testid="client-email"]', 'firefox@test.com');
      await page.fill('[data-testid="client-address"]', '123 Firefox St');
      await page.fill('[data-testid="client-phone"]', '555-1234');

      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-0"]', 'Firefox Service');
      await page.fill('[data-testid="line-item-quantity-0"]', '1');
      await page.fill('[data-testid="line-item-unit-price-0"]', '100.00');

      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf"]');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/invoice.*\.(pdf|json)$/i);
    });

    test('should work in Safari', async ({ page, browserName }) => {
      if (browserName !== 'webkit') return;

      await page.fill('[data-testid="client-name"]', 'Safari Test Client');
      await page.fill('[data-testid="client-email"]', 'safari@test.com');
      await page.fill('[data-testid="client-address"]', '123 Safari St');
      await page.fill('[data-testid="client-phone"]', '555-1234');

      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-0"]', 'Safari Service');
      await page.fill('[data-testid="line-item-quantity-0"]', '1');
      await page.fill('[data-testid="line-item-unit-price-0"]', '100.00');

      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf"]');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/invoice.*\.(pdf|json)$/i);
    });
  });

  test.describe('Mobile Compatibility', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.fill('[data-testid="client-name"]', 'Mobile Test Client');
      await page.fill('[data-testid="client-email"]', 'mobile@test.com');
      await page.fill('[data-testid="client-address"]', '123 Mobile St');
      await page.fill('[data-testid="client-phone"]', '555-1234');

      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-0"]', 'Mobile Service');
      await page.fill('[data-testid="line-item-quantity-0"]', '1');
      await page.fill('[data-testid="line-item-unit-price-0"]', '100.00');

      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf"]');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/invoice.*\.(pdf|json)$/i);
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.fill('[data-testid="client-name"]', 'Tablet Test Client');
      await page.fill('[data-testid="client-email"]', 'tablet@test.com');
      await page.fill('[data-testid="client-address"]', '123 Tablet St');
      await page.fill('[data-testid="client-phone"]', '555-1234');

      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-0"]', 'Tablet Service');
      await page.fill('[data-testid="line-item-quantity-0"]', '1');
      await page.fill('[data-testid="line-item-unit-price-0"]', '100.00');

      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf"]');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/invoice.*\.(pdf|json)$/i);
    });
  });

  test.describe('Performance Tests', () => {
    test('should download PDF within acceptable time', async ({ page }) => {
      // Fill invoice data
      await page.fill('[data-testid="client-name"]', 'Performance Test Client');
      await page.fill('[data-testid="client-email"]', 'perf@test.com');
      await page.fill('[data-testid="client-address"]', '123 Performance St');
      await page.fill('[data-testid="client-phone"]', '555-1234');

      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-0"]', 'Performance Service');
      await page.fill('[data-testid="line-item-quantity-0"]', '1');
      await page.fill('[data-testid="line-item-unit-price-0"]', '100.00');

      // Measure download time
      const startTime = Date.now();
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf"]');
      const download = await downloadPromise;
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(download.suggestedFilename()).toMatch(/invoice.*\.(pdf|json)$/i);
    });

    test('should handle multiple rapid downloads', async ({ page }) => {
      // Fill invoice data
      await page.fill('[data-testid="client-name"]', 'Rapid Test Client');
      await page.fill('[data-testid="client-email"]', 'rapid@test.com');
      await page.fill('[data-testid="client-address"]', '123 Rapid St');
      await page.fill('[data-testid="client-phone"]', '555-1234');

      await page.click('[data-testid="add-line-item"]');
      await page.fill('[data-testid="line-item-description-0"]', 'Rapid Service');
      await page.fill('[data-testid="line-item-quantity-0"]', '1');
      await page.fill('[data-testid="line-item-unit-price-0"]', '100.00');

      // Try multiple downloads
      const download1Promise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf"]');
      const download1 = await download1Promise;

      const download2Promise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf"]');
      const download2 = await download2Promise;

      expect(download1.suggestedFilename()).toMatch(/invoice.*\.(pdf|json)$/i);
      expect(download2.suggestedFilename()).toMatch(/invoice.*\.(pdf|json)$/i);
    });
  });
});
