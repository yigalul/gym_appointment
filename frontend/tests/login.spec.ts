import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
    test('should allow user to login with valid credentials', async ({ page }) => {
        // 1. Go to login page
        await page.goto('http://localhost:3000/login');

        // 2. Verify "Welcome Back" header exists
        await expect(page.getByRole('heading', { level: 2, name: 'Welcome Back' })).toBeVisible();

        // 3. Fill in credentials (admin example)
        await page.fill('input[type="email"]', 'admin@gym.com');
        await page.fill('input[type="password"]', 'adminpassword');

        // 4. Submit form
        await page.click('button[type="submit"]');

        // 5. Verify redirect to dashboard
        await expect(page).toHaveURL(/\/dashboard\/admin/);

        // 6. Verify sidebar content (Unified sidebar means no role headers)
        const sidebar = page.locator('nav');
        await expect(sidebar).toBeVisible();
        await expect(sidebar).not.toContainText('TRAINER'); // Case might vary but checking for header text
        await expect(sidebar).not.toContainText('CLIENT');

        // But links should exist
        await expect(page.getByRole('link', { name: 'Admin Overview' })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('http://localhost:3000/login');

        await page.fill('input[type="email"]', 'admin@gym.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        await expect(page.getByText('Invalid credentials')).toBeVisible();
    });
});
