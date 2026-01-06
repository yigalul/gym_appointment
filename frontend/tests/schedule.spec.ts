import { test, expect } from '@playwright/test';

test.describe('Trainer Schedule Restrictions', () => {
    test.beforeEach(async ({ page }) => {
        // Login as Trainer
        await page.goto('http://localhost:3000/login');
        // Use the click-to-fill for reliability
        await page.click('text=Trainer: sarah@gym.com / trainerpassword');
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL('http://localhost:3000/dashboard');
    });

    test('should not show Saturday in day options', async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard/schedule');

        // Wait for loading to complete
        await expect(page.getByText('Schedule & Availability')).toBeVisible();

        const daySelect = page.locator('select').first(); // First select is Day
        // Check content of options
        const options = await daySelect.locator('option').allInnerTexts();
        expect(options).toContain('Sunday');
        expect(options).toContain('Friday');
        expect(options).not.toContain('Saturday');
    });

    test('should allow selecting Morning and Evening shifts only', async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard/schedule');

        // Wait for page load
        await expect(page.getByText('Schedule & Availability')).toBeVisible();

        // Select dropdown for "Shift" (Label text check might be needed or based on order)
        // Based on component code: Day is 1st select, Shift is 2nd select
        const shiftSelect = page.locator('select').nth(1);

        await expect(shiftSelect).toBeVisible();
        const options = await shiftSelect.locator('option').allInnerTexts();
        expect(options).toContain('Morning (07:00 - 12:00)');
        expect(options).toContain('Evening (15:00 - 20:00)');

        // Add a morning slot
        await shiftSelect.selectOption('morning');
        await page.click('button:has-text("Add Slot")');

        // Verify it appeared in the list with correct text
        await expect(page.getByText('Morning Shift (07:00 - 12:00)')).toBeVisible();

        // Add an evening slot
        await shiftSelect.selectOption('evening');
        await page.click('button:has-text("Add Slot")');

        // Verify it appeared
        await expect(page.getByText('Evening Shift (15:00 - 20:00)')).toBeVisible();
    });
});
