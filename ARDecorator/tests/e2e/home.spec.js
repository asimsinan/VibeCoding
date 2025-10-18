import { test, expect } from '@playwright/test';
test.describe('Home Page', () => {
    test('should display home page with hero section', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('h2')).toContainText('Visualize Your Dream Home');
        await expect(page.locator('text=Start Decorating')).toBeVisible();
    });
    test('should navigate to editor page', async ({ page }) => {
        await page.goto('/');
        await page.click('text=Start Decorating');
        await expect(page).toHaveURL('/editor');
    });
    test('should display feature cards', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('text=Upload Room Photo')).toBeVisible();
        await expect(page.locator('text=Place Furniture')).toBeVisible();
        await expect(page.locator('text=Preview in AR')).toBeVisible();
    });
});
//# sourceMappingURL=home.spec.js.map