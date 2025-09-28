/**
 * End-to-End Tests for Mood Logging
 * Tests complete user workflows with Playwright
 * 
 * These tests validate the complete mood logging functionality
 * Following TDD methodology: Contract → Integration → E2E → Unit → Implementation
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const testMoodEntry = {
  rating: 7,
  notes: 'Feeling good today, had a great workout'
};

const testMoodEntryUpdate = {
  rating: 8,
  notes: 'Updated: Feeling even better after lunch'
};

// Helper functions
async function navigateToMoodLogging(page: Page) {
  await page.goto('/mood')
  await expect(page).toHaveTitle(/Mental Health Journal App/)
  await expect(page.locator('h1')).toContainText('Log Today\'s Mood')
}

async function fillMoodForm(page: Page, rating: number, notes?: string) {
  // Select mood rating
  await page.click(`button[aria-pressed="false"]:has-text("${rating}")`)
  await expect(page.locator(`button[aria-pressed="true"]:has-text("${rating}")`)).toBeVisible()
  
  // Fill notes if provided
  if (notes) {
    await page.fill('textarea[name="notes"]', notes)
    await expect(page.locator('textarea[name="notes"]')).toHaveValue(notes)
  }
}

async function submitMoodForm(page: Page) {
  await page.click('button[type="submit"]')
  await page.waitForLoadState('networkidle')
}

test.describe('Mood Logging E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing mood data
    await page.goto('/')
    await page.evaluate(() => {
      if ('indexedDB' in window) {
        return new Promise((resolve) => {
          const deleteReq = indexedDB.deleteDatabase('MoodTrackerDB')
          deleteReq.onsuccess = () => resolve(undefined)
          deleteReq.onerror = () => resolve(undefined)
        })
      }
    })
  });

  test('should display mood logging interface', async ({ page }) => {
    await navigateToMoodLogging(page)
    
    // Verify page elements
    await expect(page.locator('h1')).toContainText('Log Today\'s Mood')
    
    // Verify mood rating buttons (1-10)
    for (let i = 1; i <= 10; i++) {
      await expect(page.locator(`button:has-text("${i}")`)).toBeVisible()
    }
    
    // Verify notes textarea
    await expect(page.locator('textarea[name="notes"]')).toBeVisible()
    
    // Verify submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  });

  test('should log a new mood entry', async ({ page }) => {
    await navigateToMoodLogging(page)
    
    // Fill and submit mood form
    await fillMoodForm(page, testMoodEntry.rating, testMoodEntry.notes)
    await submitMoodForm(page)
    
    // Verify mood was saved (should redirect to home with success)
    await expect(page).toHaveURL(/\?mood=saved$/)
  });

  test('should validate required rating selection', async ({ page }) => {
    await navigateToMoodLogging(page)
    
    // Try to submit without selecting rating
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Please select a mood rating')).toBeVisible()
  });

  test('should log mood without notes', async ({ page }) => {
    await navigateToMoodLogging(page)
    
    // Fill only rating, no notes
    await fillMoodForm(page, 5)
    await submitMoodForm(page)
    
    // Verify mood was saved
    await expect(page).toHaveURL(/\?mood=saved$/)
  });

  test('should handle form cancellation', async ({ page }) => {
    await navigateToMoodLogging(page)
    
    // Fill form
    await fillMoodForm(page, 7, 'Some notes')
    
    // Click cancel
    await page.click('a:has-text("Cancel")')
    
    // Should navigate back to home page
    await expect(page).toHaveURL('/')
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    await navigateToMoodLogging(page)
    
    // Tab through form elements
    await page.keyboard.press('Tab')
    await expect(page.locator('button:has-text("1")')).toBeFocused()
    
    // Navigate through rating buttons with arrow keys
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button:has-text("2")')).toBeFocused()
    
    // Tab to notes field
    await page.keyboard.press('Tab')
    await expect(page.locator('textarea[name="notes"]')).toBeFocused()
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await navigateToMoodLogging(page)
    
    // Verify mobile layout
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('button:has-text("1")')).toBeVisible()
    await expect(page.locator('textarea[name="notes"]')).toBeVisible()
    
    // Test mobile interaction
    await fillMoodForm(page, 8, 'Mobile test')
    await submitMoodForm(page)
    
    await expect(page).toHaveURL(/\?mood=saved$/)
  });

});
