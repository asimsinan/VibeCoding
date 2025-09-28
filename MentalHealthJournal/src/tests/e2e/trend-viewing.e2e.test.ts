import { test, expect, Page } from '@playwright/test'

// Test data
const testMoodEntries = [
  { rating: 7, notes: 'Good day', date: '2024-01-25' },
  { rating: 8, notes: 'Great day', date: '2024-01-26' },
  { rating: 6, notes: 'Okay day', date: '2024-01-27' },
  { rating: 9, notes: 'Excellent day', date: '2024-01-28' }
]

// Helper functions
async function navigateToTrends(page: Page) {
  await page.goto('/trends')
  await expect(page).toHaveTitle(/Mental Health Journal App/)
  await expect(page.locator('h1')).toContainText('Mood Trends')
}

async function createTestMoodEntries(page: Page) {
  for (const entry of testMoodEntries) {
    await page.goto('/mood')
    
    // Select mood rating
    await page.click(`button[aria-pressed="false"]:has-text("${entry.rating}")`)
    
    // Fill notes
    await page.fill('textarea[name="notes"]', entry.notes)
    
    // Submit form
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')
  }
}

// Test suite for trend viewing functionality
test.describe('Trend Viewing E2E Tests', () => {
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
  })

  test('should display trends page correctly', async ({ page }) => {
    await navigateToTrends(page)
    
    // Verify page elements
    await expect(page.locator('h1')).toContainText('Mood Trends')
    await expect(page.locator('text=Analyze your mood patterns')).toBeVisible()
    
    // Verify period filter buttons
    await expect(page.locator('button:has-text("Last 7 Days")')).toBeVisible()
    await expect(page.locator('button:has-text("Last 30 Days")')).toBeVisible()
    await expect(page.locator('button:has-text("Last 90 Days")')).toBeVisible()
    await expect(page.locator('button:has-text("Last Year")')).toBeVisible()
    
    // Verify chart container
    await expect(page.locator('canvas')).toBeVisible()
  })

  test('should show empty state when no mood data exists', async ({ page }) => {
    await navigateToTrends(page)
    
    // Verify empty state
    await expect(page.locator('text=No mood data available')).toBeVisible()
    await expect(page.locator('text=You need to log some moods before you can view trends')).toBeVisible()
    await expect(page.locator('a:has-text("Log Your First Mood")')).toBeVisible()
  })

  test('should display mood trends with data', async ({ page }) => {
    // Create test mood entries
    await createTestMoodEntries(page)
    
    // Navigate to trends page
    await navigateToTrends(page)
    
    // Verify chart is displayed
    await expect(page.locator('canvas')).toBeVisible()
    
    // Verify stats cards
    await expect(page.locator('text=Average Rating')).toBeVisible()
    await expect(page.locator('text=Highest Rating')).toBeVisible()
    await expect(page.locator('text=Lowest Rating')).toBeVisible()
    await expect(page.locator('text=Total Entries')).toBeVisible()
  })

  test('should filter trends by time period', async ({ page }) => {
    // Create test mood entries
    await createTestMoodEntries(page)
    
    // Navigate to trends page
    await navigateToTrends(page)
    
    // Test different time periods
    const periods = [
      { button: 'Last 7 Days', period: 'week' },
      { button: 'Last 30 Days', period: 'month' },
      { button: 'Last 90 Days', period: 'quarter' },
      { button: 'Last Year', period: 'year' }
    ]
    
    for (const { button, period } of periods) {
      await page.click(`button:has-text("${button}")`)
      
      // Verify period is selected
      await expect(page.locator(`button:has-text("${button}")`)).toHaveClass(/bg-blue-100/)
      
      // Verify chart updates
      await expect(page.locator('canvas')).toBeVisible()
    }
  })

  test('should display correct statistics', async ({ page }) => {
    // Create test mood entries
    await createTestMoodEntries(page)
    
    // Navigate to trends page
    await navigateToTrends(page)
    
    // Verify statistics are calculated correctly
    const ratings = testMoodEntries.map(entry => entry.rating)
    const average = (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
    const highest = Math.max(...ratings)
    const lowest = Math.min(...ratings)
    
    // Check average rating
    await expect(page.locator(`text=${average}`)).toBeVisible()
    
    // Check highest rating
    await expect(page.locator(`text=${highest}`)).toBeVisible()
    
    // Check lowest rating
    await expect(page.locator(`text=${lowest}`)).toBeVisible()
    
    // Check total entries
    await expect(page.locator(`text=${testMoodEntries.length}`)).toBeVisible()
  })

  test('should show insights when data exists', async ({ page }) => {
    // Create test mood entries
    await createTestMoodEntries(page)
    
    // Navigate to trends page
    await navigateToTrends(page)
    
    // Verify insights section
    await expect(page.locator('text=Insights')).toBeVisible()
    await expect(page.locator('text=Your average mood over the selected period')).toBeVisible()
    await expect(page.locator('text=Your best day was rated')).toBeVisible()
    await expect(page.locator('text=Your most challenging day was rated')).toBeVisible()
  })

  test('should be accessible with keyboard navigation', async ({ page }) => {
    await navigateToTrends(page)
    
    // Tab through period filter buttons
    await page.keyboard.press('Tab')
    await expect(page.locator('button:has-text("Last 7 Days")')).toBeFocused()
    
    // Navigate through buttons with arrow keys
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button:has-text("Last 30 Days")')).toBeFocused()
    
    // Tab to log mood button
    await page.keyboard.press('Tab')
    await expect(page.locator('a:has-text("Log New Mood")')).toBeFocused()
  })

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Create test mood entries
    await createTestMoodEntries(page)
    
    // Navigate to trends page
    await navigateToTrends(page)
    
    // Verify mobile layout
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('canvas')).toBeVisible()
    
    // Verify stats cards are visible
    await expect(page.locator('text=Average Rating')).toBeVisible()
    await expect(page.locator('text=Total Entries')).toBeVisible()
  })

  test('should handle chart interactions', async ({ page }) => {
    // Create test mood entries
    await createTestMoodEntries(page)
    
    // Navigate to trends page
    await navigateToTrends(page)
    
    // Verify chart is interactive
    await expect(page.locator('canvas')).toBeVisible()
    
    // Hover over chart points (if supported by Chart.js)
    const chart = page.locator('canvas')
    await chart.hover()
    
    // Verify chart tooltips or interactions work
    // This would depend on Chart.js implementation
  })

  test('should navigate to mood logging from trends page', async ({ page }) => {
    await navigateToTrends(page)
    
    // Click log new mood button
    await page.click('a:has-text("Log New Mood")')
    
    // Should navigate to mood logging page
    await expect(page).toHaveURL('/mood')
    await expect(page.locator('h1')).toContainText('Log Today\'s Mood')
  })

  test('should handle empty state navigation', async ({ page }) => {
    await navigateToTrends(page)
    
    // Click log first mood button
    await page.click('a:has-text("Log Your First Mood")')
    
    // Should navigate to mood logging page
    await expect(page).toHaveURL('/mood')
    await expect(page.locator('h1')).toContainText('Log Today\'s Mood')
  })
})