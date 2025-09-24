import { test, expect } from '@playwright/test';

test.describe('Invoice Management E2E Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="app"]', { timeout: 10000 });
  });

  test('Complete Invoice Creation Workflow', async ({ page }) => {
    // Navigate to create invoice page
    await page.click('text=Create Invoice');
    await expect(page).toHaveURL('/create');

    // Fill in client information
    await page.fill('[data-testid="client-name"]', 'Test Client');
    await page.fill('[data-testid="client-email"]', 'test@example.com');
    await page.fill('[data-testid="client-address"]', '123 Test Street');
    await page.fill('[data-testid="client-phone"]', '123-456-7890');

    // Add line items
    await page.click('text=Add Item');
    await page.fill('[data-testid="item-description-0"]', 'Test Service');
    await page.fill('[data-testid="item-quantity-0"]', '2');
    await page.fill('[data-testid="item-unit-price-0"]', '50');

    // Set tax rate
    await page.fill('[data-testid="tax-rate"]', '10');

    // Verify preview updates
    await expect(page.locator('[data-testid="invoice-preview"]')).toContainText('Test Client');
    await expect(page.locator('[data-testid="invoice-preview"]')).toContainText('Test Service');
    await expect(page.locator('[data-testid="invoice-preview"]')).toContainText('$100.00');
    await expect(page.locator('[data-testid="invoice-preview"]')).toContainText('$10.00');
    await expect(page.locator('[data-testid="invoice-preview"]')).toContainText('$110.00');

    // Save invoice
    await page.click('[data-testid="save-invoice-button"]');
    
    // Verify success message
    await expect(page.locator('.toast')).toContainText('Invoice saved successfully!');
    
    // Verify saved indicator appears
    await expect(page.locator('.saved-indicator')).toBeVisible();
  });

  test('Invoice Template Selection Workflow', async ({ page }) => {
    // Navigate to create invoice page
    await page.click('text=Create Invoice');
    await expect(page).toHaveURL('/create');

    // Open template modal
    await page.click('text=Use Template');
    await expect(page.locator('.modal')).toBeVisible();

    // Select a template
    await page.click('text=Web Development');
    
    // Verify form is populated
    await expect(page.locator('[data-testid="client-name"]')).toHaveValue('');
    await expect(page.locator('[data-testid="item-description-0"]')).toHaveValue('Frontend Development');
    await expect(page.locator('[data-testid="item-description-1"]')).toHaveValue('Backend Development');
    await expect(page.locator('[data-testid="item-description-2"]')).toHaveValue('Testing & QA');

    // Verify success message
    await expect(page.locator('.toast')).toContainText('Template applied successfully!');
  });

  test('Invoice List Management Workflow', async ({ page }) => {
    // Navigate to invoices list
    await page.click('text=Invoices');
    await expect(page).toHaveURL('/invoices');

    // Search for invoices
    await page.fill('[data-testid="search-input"]', 'Test');
    
    // Filter by status
    await page.selectOption('[data-testid="status-filter"]', 'sent');
    
    // Sort by date
    await page.click('text=Date');
    
    // Verify table updates
    await expect(page.locator('[data-testid="invoice-table"]')).toBeVisible();
  });

  test('Invoice Detail View and Edit Workflow', async ({ page }) => {
    // First create an invoice
    await page.click('text=Create Invoice');
    await page.fill('[data-testid="client-name"]', 'Detail Test Client');
    await page.fill('[data-testid="client-email"]', 'detail@example.com');
    await page.fill('[data-testid="client-address"]', '456 Detail Street');
    await page.click('[data-testid="save-invoice-button"]');
    
    // Navigate to invoices list
    await page.click('text=Invoices');
    
    // Click on first invoice
    await page.click('[data-testid="invoice-link"]:first-child');
    
    // Verify detail page loads
    await expect(page.locator('[data-testid="invoice-detail"]')).toBeVisible();
    await expect(page.locator('[data-testid="invoice-detail"]')).toContainText('Detail Test Client');
    
    // Edit invoice
    await page.click('text=Edit');
    await page.fill('[data-testid="client-name"]', 'Updated Client Name');
    await page.click('text=Save Changes');
    
    // Verify update
    await expect(page.locator('.toast')).toContainText('Invoice updated successfully!');
    await expect(page.locator('[data-testid="invoice-detail"]')).toContainText('Updated Client Name');
  });

  test('Bulk Operations Workflow', async ({ page }) => {
    // Navigate to invoices list
    await page.click('text=Invoices');
    
    // Select multiple invoices
    await page.check('[data-testid="select-all-checkbox"]');
    
    // Verify bulk actions appear
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
    
    // Test bulk delete
    await page.click('text=Delete Selected');
    await page.click('text=Confirm');
    
    // Verify success message
    await expect(page.locator('.toast')).toContainText('Invoices deleted successfully!');
  });

  test('Export Operations Workflow', async ({ page }) => {
    // Navigate to invoices list
    await page.click('text=Invoices');
    
    // Test CSV export
    const csvDownloadPromise = page.waitForEvent('download');
    await page.click('text=Export CSV');
    const csvDownload = await csvDownloadPromise;
    expect(csvDownload.suggestedFilename()).toContain('.csv');
    
    // Test JSON export
    const jsonDownloadPromise = page.waitForEvent('download');
    await page.click('text=Export JSON');
    const jsonDownload = await jsonDownloadPromise;
    expect(jsonDownload.suggestedFilename()).toContain('.json');
  });

  test('PDF Generation and Print Workflow', async ({ page }) => {
    // Create an invoice
    await page.click('text=Create Invoice');
    await page.fill('[data-testid="client-name"]', 'PDF Test Client');
    await page.fill('[data-testid="client-email"]', 'pdf@example.com');
    await page.fill('[data-testid="client-address"]', '789 PDF Street');
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="item-description-0"]', 'PDF Test Item');
    await page.fill('[data-testid="item-quantity-0"]', '1');
    await page.fill('[data-testid="item-unit-price-0"]', '100');
    
    // Test PDF download
    const pdfDownloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-pdf-button"]');
    const pdfDownload = await pdfDownloadPromise;
    expect(pdfDownload.suggestedFilename()).toContain('.pdf');
    
    // Test print functionality
    const printPromise = page.waitForEvent('popup');
    await page.click('[data-testid="print-button"]');
    const printWindow = await printPromise;
    await expect(printWindow).toHaveURL(/blob:/);
  });

  test('Settings Configuration Workflow', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings');
    await expect(page).toHaveURL('/settings');
    
    // Configure due date tracking
    await page.fill('[data-testid="default-due-days"]', '45');
    await page.fill('[data-testid="reminder-days"]', '10');
    await page.check('[data-testid="auto-update-status"]');
    
    // Verify settings are saved
    await expect(page.locator('.toast')).toContainText('Settings updated!');
    
    // Open numbering settings
    await page.click('text=Configure Numbering');
    await expect(page.locator('.modal')).toBeVisible();
    
    // Configure numbering
    await page.fill('[data-testid="prefix-input"]', 'BILL');
    await page.selectOption('[data-testid="padding-select"]', '5');
    await page.selectOption('[data-testid="separator-select"]', '_');
    await page.check('[data-testid="include-year"]');
    
    // Save numbering settings
    await page.click('text=Save Settings');
    await expect(page.locator('.toast')).toContainText('Settings saved successfully!');
  });

  test('Error Handling Workflow', async ({ page }) => {
    // Test form validation
    await page.click('text=Create Invoice');
    await page.click('[data-testid="save-invoice-button"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Please fill in all required fields');
    
    // Test invalid email
    await page.fill('[data-testid="client-name"]', 'Test Client');
    await page.fill('[data-testid="client-email"]', 'invalid-email');
    await page.fill('[data-testid="client-address"]', '123 Test St');
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="item-description-0"]', 'Test Item');
    await page.fill('[data-testid="item-quantity-0"]', '1');
    await page.fill('[data-testid="item-unit-price-0"]', '100');
    await page.click('[data-testid="save-invoice-button"]');
    
    // Verify email validation error
    await expect(page.locator('[data-testid="client-email-error"]')).toContainText('Invalid email format');
  });

  test('Responsive Design Workflow', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to create invoice
    await page.click('text=Create Invoice');
    
    // Verify mobile navigation
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Test mobile form layout
    await expect(page.locator('[data-testid="client-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-items-manager"]')).toBeVisible();
    
    // Test mobile preview
    await page.fill('[data-testid="client-name"]', 'Mobile Test Client');
    await expect(page.locator('[data-testid="invoice-preview"]')).toContainText('Mobile Test Client');
  });

  test('Due Date Alerts Workflow', async ({ page }) => {
    // Create an overdue invoice
    await page.click('text=Create Invoice');
    await page.fill('[data-testid="client-name"]', 'Overdue Client');
    await page.fill('[data-testid="client-email"]', 'overdue@example.com');
    await page.fill('[data-testid="client-address"]', '123 Overdue St');
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="item-description-0"]', 'Overdue Item');
    await page.fill('[data-testid="item-quantity-0"]', '1');
    await page.fill('[data-testid="item-unit-price-0"]', '100');
    await page.click('[data-testid="save-invoice-button"]');
    
    // Navigate to dashboard
    await page.click('text=Dashboard');
    
    // Verify due date alerts appear
    await expect(page.locator('[data-testid="due-date-alerts"]')).toBeVisible();
    
    // Test alert interaction
    await page.click('[data-testid="alert-item"]:first-child');
    await expect(page).toHaveURL(/\/invoices\/\d+/);
  });
});