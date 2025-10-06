/**
 * Collaboration E2E Tests
 * 
 * End-to-end tests for multi-user collaboration functionality.
 * Tests real-time synchronization, conflict resolution, and user presence.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

interface TestUser {
  page: Page
  context: BrowserContext
  userId: string
  displayName: string
}

/**
 * Create a test user with a new browser context
 */
async function createTestUser(browser: any, userId: string, displayName: string): Promise<TestUser> {
  const context = await browser.newContext()
  const page = await context.newPage()
  
  // Mock authentication
  await page.addInitScript((user) => {
    window.localStorage.setItem('test-user-id', user.id)
    window.localStorage.setItem('test-user-display-name', user.displayName)
  }, { id: userId, displayName })

  return { page, context, userId, displayName }
}

test.describe('Collaborative Whiteboard', () => {
  let user1: TestUser
  let user2: TestUser
  let whiteboardId: string

  test.beforeEach(async ({ browser }) => {
    // Create two test users
    user1 = await createTestUser(browser, 'user-1', 'Alice')
    user2 = await createTestUser(browser, 'user-2', 'Bob')

    // Create a new whiteboard
    whiteboardId = 'test-whiteboard-' + Date.now()
  })

  test.afterEach(async () => {
    // Clean up browser contexts
    await user1.context.close()
    await user2.context.close()
  })

  test('should allow multiple users to collaborate in real-time', async () => {
    // Navigate both users to the whiteboard
    await user1.page.goto(`/whiteboard/${whiteboardId}`)
    await user2.page.goto(`/whiteboard/${whiteboardId}`)

    // Wait for both pages to load
    await expect(user1.page.locator('[data-testid="whiteboard-canvas"]')).toBeVisible()
    await expect(user2.page.locator('[data-testid="whiteboard-canvas"]')).toBeVisible()

    // User 1 draws something
    await user1.page.click('[data-testid="pen-tool"]')
    await user1.page.mouse.move(100, 100)
    await user1.page.mouse.down()
    await user1.page.mouse.move(200, 200)
    await user1.page.mouse.up()

    // User 2 should see the drawing
    await expect(user2.page.locator('[data-testid="drawing-element"]')).toBeVisible()

    // User 2 adds a sticky note
    await user2.page.click('[data-testid="add-sticky-note"]')
    await user2.page.click('canvas', { position: { x: 300, y: 300 } })
    await user2.page.fill('[data-testid="sticky-note-input"]', 'Hello from Bob!')
    await user2.page.press('[data-testid="sticky-note-input"]', 'Enter')

    // User 1 should see the sticky note
    await expect(user1.page.locator('[data-testid="sticky-note"]')).toContainText('Hello from Bob!')

    // User 1 should see user presence
    await expect(user1.page.locator('[data-testid="user-presence"]')).toContainText('Bob')
  })

  test('should handle concurrent drawing operations', async () => {
    // Navigate both users to the whiteboard
    await user1.page.goto(`/whiteboard/${whiteboardId}`)
    await user2.page.goto(`/whiteboard/${whiteboardId}`)

    // Both users draw simultaneously
    await Promise.all([
      // User 1 draws
      user1.page.click('[data-testid="pen-tool"]'),
      user1.page.mouse.move(100, 100),
      user1.page.mouse.down(),
      user1.page.mouse.move(150, 150),
      user1.page.mouse.up(),
      
      // User 2 draws
      user2.page.click('[data-testid="brush-tool"]'),
      user2.page.mouse.move(200, 200),
      user2.page.mouse.down(),
      user2.page.mouse.move(250, 250),
      user2.page.mouse.up()
    ])

    // Both users should see both drawings
    await expect(user1.page.locator('[data-testid="drawing-element"]')).toHaveCount(2)
    await expect(user2.page.locator('[data-testid="drawing-element"]')).toHaveCount(2)
  })

  test('should handle sticky note editing conflicts', async () => {
    // Navigate both users to the whiteboard
    await user1.page.goto(`/whiteboard/${whiteboardId}`)
    await user2.page.goto(`/whiteboard/${whiteboardId}`)

    // User 1 creates a sticky note
    await user1.page.click('[data-testid="add-sticky-note"]')
    await user1.page.click('canvas', { position: { x: 100, y: 100 } })
    await user1.page.fill('[data-testid="sticky-note-input"]', 'Original content')
    await user1.page.press('[data-testid="sticky-note-input"]', 'Enter')

    // User 2 tries to edit the same sticky note
    await user2.page.click('[data-testid="sticky-note"]')
    await user2.page.fill('[data-testid="sticky-note-input"]', 'Edited by Bob')
    await user2.page.press('[data-testid="sticky-note-input"]', 'Enter')

    // User 1 should see the updated content
    await expect(user1.page.locator('[data-testid="sticky-note"]')).toContainText('Edited by Bob')
  })

  test('should show user presence indicators', async () => {
    // Navigate both users to the whiteboard
    await user1.page.goto(`/whiteboard/${whiteboardId}`)
    await user2.page.goto(`/whiteboard/${whiteboardId}`)

    // User 1 should see User 2's presence
    await expect(user1.page.locator('[data-testid="user-presence"]')).toContainText('Bob')
    await expect(user1.page.locator('[data-testid="user-count"]')).toContainText('2 users online')

    // User 2 should see User 1's presence
    await expect(user2.page.locator('[data-testid="user-presence"]')).toContainText('Alice')
    await expect(user2.page.locator('[data-testid="user-count"]')).toContainText('2 users online')
  })

  test('should handle network disconnection and reconnection', async () => {
    // Navigate both users to the whiteboard
    await user1.page.goto(`/whiteboard/${whiteboardId}`)
    await user2.page.goto(`/whiteboard/${whiteboardId}`)

    // User 1 draws something
    await user1.page.click('[data-testid="pen-tool"]')
    await user1.page.mouse.move(100, 100)
    await user1.page.mouse.down()
    await user1.page.mouse.move(200, 200)
    await user1.page.mouse.up()

    // Simulate network disconnection for User 2
    await user2.context.setOffline(true)
    await user2.page.waitForTimeout(1000)

    // User 1 adds a sticky note while User 2 is offline
    await user1.page.click('[data-testid="add-sticky-note"]')
    await user1.page.click('canvas', { position: { x: 300, y: 300 } })
    await user1.page.fill('[data-testid="sticky-note-input"]', 'Added while offline')
    await user1.page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Reconnect User 2
    await user2.context.setOffline(false)
    await user2.page.waitForTimeout(2000)

    // User 2 should see the changes that occurred while offline
    await expect(user2.page.locator('[data-testid="drawing-element"]')).toBeVisible()
    await expect(user2.page.locator('[data-testid="sticky-note"]')).toContainText('Added while offline')
  })

  test('should handle rapid drawing movements', async () => {
    // Navigate both users to the whiteboard
    await user1.page.goto(`/whiteboard/${whiteboardId}`)
    await user2.page.goto(`/whiteboard/${whiteboardId}`)

    // User 1 performs rapid drawing movements
    await user1.page.click('[data-testid="pen-tool"]')
    
    for (let i = 0; i < 10; i++) {
      await user1.page.mouse.move(100 + i * 10, 100 + i * 5)
      await user1.page.mouse.down()
      await user1.page.mouse.move(110 + i * 10, 110 + i * 5)
      await user1.page.mouse.up()
      await user1.page.waitForTimeout(10) // Small delay between strokes
    }

    // User 2 should see the final result
    await expect(user2.page.locator('[data-testid="drawing-element"]')).toBeVisible()
  })

  test('should handle whiteboard clearing', async () => {
    // Navigate both users to the whiteboard
    await user1.page.goto(`/whiteboard/${whiteboardId}`)
    await user2.page.goto(`/whiteboard/${whiteboardId}`)

    // Both users add content
    await user1.page.click('[data-testid="pen-tool"]')
    await user1.page.mouse.move(100, 100)
    await user1.page.mouse.down()
    await user1.page.mouse.move(200, 200)
    await user1.page.mouse.up()

    await user2.page.click('[data-testid="add-sticky-note"]')
    await user2.page.click('canvas', { position: { x: 300, y: 300 } })
    await user2.page.fill('[data-testid="sticky-note-input"]', 'Test note')
    await user2.page.press('[data-testid="sticky-note-input"]', 'Enter')

    // User 1 clears the whiteboard
    await user1.page.click('[data-testid="clear-whiteboard"]')
    await user1.page.click('[data-testid="confirm-clear"]')

    // Both users should see the whiteboard is cleared
    await expect(user1.page.locator('[data-testid="drawing-element"]')).toHaveCount(0)
    await expect(user1.page.locator('[data-testid="sticky-note"]')).toHaveCount(0)
    await expect(user2.page.locator('[data-testid="drawing-element"]')).toHaveCount(0)
    await expect(user2.page.locator('[data-testid="sticky-note"]')).toHaveCount(0)
  })
})