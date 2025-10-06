/**
 * Sticky Notes E2E Tests
 * 
 * End-to-end tests for sticky note functionality.
 * Tests creation, editing, deletion, and positioning of sticky notes.
 */

import { test, expect, Page } from '@playwright/test'

test.describe('Sticky Notes Functionality', () => {
  let page: Page
  let whiteboardId: string

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext()
    page = await context.newPage()
    
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('test-user-id', 'test-user')
      window.localStorage.setItem('test-user-display-name', 'Test User')
    })

    whiteboardId = 'test-whiteboard-' + Date.now()
    await page.goto(`/whiteboard/${whiteboardId}`)
  })

  test('should create a sticky note by clicking add button', async () => {
    // Click add sticky note button
    await page.click('[data-testid="add-sticky-note"]')
    
    // Click on canvas to place sticky note
    await page.click('canvas', { position: { x: 100, y: 100 } })
    
    // Fill in sticky note content
    await page.fill('[data-testid="sticky-note-input"]', 'Test sticky note')
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Verify sticky note was created
    await expect(page.locator('[data-testid="sticky-note"]')).toBeVisible()
    await expect(page.locator('[data-testid="sticky-note"]')).toContainText('Test sticky note')
  })

  test('should create a sticky note using keyboard shortcut', async () => {
    // Use Ctrl+N shortcut to add sticky note
    await page.keyboard.press('Control+n')
    
    // Click on canvas to place sticky note
    await page.click('canvas', { position: { x: 200, y: 200 } })
    
    // Fill in sticky note content
    await page.fill('[data-testid="sticky-note-input"]', 'Keyboard shortcut note')
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Verify sticky note was created
    await expect(page.locator('[data-testid="sticky-note"]')).toBeVisible()
    await expect(page.locator('[data-testid="sticky-note"]')).toContainText('Keyboard shortcut note')
  })

  test('should edit sticky note content', async () => {
    // Create a sticky note
    await page.click('[data-testid="add-sticky-note"]')
    await page.click('canvas', { position: { x: 100, y: 100 } })
    await page.fill('[data-testid="sticky-note-input"]', 'Original content')
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Click on sticky note to edit
    await page.click('[data-testid="sticky-note"]')
    
    // Edit content
    await page.fill('[data-testid="sticky-note-input"]', 'Updated content')
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Verify content was updated
    await expect(page.locator('[data-testid="sticky-note"]')).toContainText('Updated content')
  })

  test('should cancel sticky note editing with Escape key', async () => {
    // Create a sticky note
    await page.click('[data-testid="add-sticky-note"]')
    await page.click('canvas', { position: { x: 100, y: 100 } })
    await page.fill('[data-testid="sticky-note-input"]', 'Original content')
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Click on sticky note to edit
    await page.click('[data-testid="sticky-note"]')
    
    // Start editing and cancel with Escape
    await page.fill('[data-testid="sticky-note-input"]', 'This should be cancelled')
    await page.press('[data-testid="sticky-note-input"]', 'Escape')

    // Verify original content is preserved
    await expect(page.locator('[data-testid="sticky-note"]')).toContainText('Original content')
  })

  test('should delete sticky note', async () => {
    // Create a sticky note
    await page.click('[data-testid="add-sticky-note"]')
    await page.click('canvas', { position: { x: 100, y: 100 } })
    await page.fill('[data-testid="sticky-note-input"]', 'To be deleted')
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Verify sticky note exists
    await expect(page.locator('[data-testid="sticky-note"]')).toBeVisible()

    // Click delete button
    await page.click('[data-testid="delete-sticky-note"]')

    // Verify sticky note was deleted
    await expect(page.locator('[data-testid="sticky-note"]')).toHaveCount(0)
  })

  test('should drag sticky note to new position', async () => {
    // Create a sticky note
    await page.click('[data-testid="add-sticky-note"]')
    await page.click('canvas', { position: { x: 100, y: 100 } })
    await page.fill('[data-testid="sticky-note-input"]', 'Draggable note')
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Get initial position
    const stickyNote = page.locator('[data-testid="sticky-note"]')
    const initialPosition = await stickyNote.boundingBox()

    // Drag sticky note to new position
    await stickyNote.dragTo(page.locator('canvas'), {
      targetPosition: { x: 300, y: 300 }
    })

    // Verify position changed
    const newPosition = await stickyNote.boundingBox()
    expect(newPosition?.x).not.toBe(initialPosition?.x)
    expect(newPosition?.y).not.toBe(initialPosition?.y)
  })

  test('should change sticky note color', async () => {
    // Create a sticky note
    await page.click('[data-testid="add-sticky-note"]')
    await page.click('canvas', { position: { x: 100, y: 100 } })
    await page.fill('[data-testid="sticky-note-input"]', 'Colorful note')
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Click color picker
    await page.click('[data-testid="sticky-note-color-picker"]')
    
    // Select red color
    await page.click('[data-testid="color-red"]')

    // Verify color changed
    const stickyNote = page.locator('[data-testid="sticky-note"]')
    await expect(stickyNote).toHaveAttribute('style', /background-color: #FF6B6B/)
  })

  test('should limit sticky note content length', async () => {
    // Create a sticky note
    await page.click('[data-testid="add-sticky-note"]')
    await page.click('canvas', { position: { x: 100, y: 100 } })
    
    // Try to enter very long content
    const longContent = 'A'.repeat(600) // Exceeds 500 character limit
    await page.fill('[data-testid="sticky-note-input"]', longContent)
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Verify content was truncated
    const stickyNote = page.locator('[data-testid="sticky-note"]')
    await expect(stickyNote).toContainText('A'.repeat(500))
    
    // Verify character count is shown
    await expect(page.locator('[data-testid="character-count"]')).toContainText('500/500')
  })

  test('should show character count while editing', async () => {
    // Create a sticky note
    await page.click('[data-testid="add-sticky-note"]')
    await page.click('canvas', { position: { x: 100, y: 100 } })
    
    // Start typing
    await page.fill('[data-testid="sticky-note-input"]', 'Hello world')
    
    // Verify character count is shown
    await expect(page.locator('[data-testid="character-count"]')).toContainText('11/500')
  })

  test('should handle multiple sticky notes', async () => {
    // Create multiple sticky notes
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="add-sticky-note"]')
      await page.click('canvas', { position: { x: 100 + i * 50, y: 100 + i * 50 } })
      await page.fill('[data-testid="sticky-note-input"]', `Note ${i + 1}`)
      await page.press('[data-testid="sticky-note-input"]', 'Enter')
    }

    // Verify all sticky notes were created
    await expect(page.locator('[data-testid="sticky-note"]')).toHaveCount(5)
  })

  test('should handle sticky note z-index ordering', async () => {
    // Create first sticky note
    await page.click('[data-testid="add-sticky-note"]')
    await page.click('canvas', { position: { x: 100, y: 100 } })
    await page.fill('[data-testid="sticky-note-input"]', 'First note')
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Create second sticky note in overlapping position
    await page.click('[data-testid="add-sticky-note"]')
    await page.click('canvas', { position: { x: 120, y: 120 } })
    await page.fill('[data-testid="sticky-note-input"]', 'Second note')
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Click on second note to bring it to front
    await page.click('[data-testid="sticky-note"]:has-text("Second note")')

    // Verify z-index ordering
    const firstNote = page.locator('[data-testid="sticky-note"]:has-text("First note")')
    const secondNote = page.locator('[data-testid="sticky-note"]:has-text("Second note")')
    
    const firstZIndex = await firstNote.evaluate(el => getComputedStyle(el).zIndex)
    const secondZIndex = await secondNote.evaluate(el => getComputedStyle(el).zIndex)
    
    expect(parseInt(secondZIndex)).toBeGreaterThan(parseInt(firstZIndex))
  })

  test('should handle sticky note selection and deselection', async () => {
    // Create a sticky note
    await page.click('[data-testid="add-sticky-note"]')
    await page.click('canvas', { position: { x: 100, y: 100 } })
    await page.fill('[data-testid="sticky-note-input"]', 'Selectable note')
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Click on sticky note to select it
    await page.click('[data-testid="sticky-note"]')
    
    // Verify selection state
    await expect(page.locator('[data-testid="sticky-note"]')).toHaveClass(/selected/)

    // Click elsewhere to deselect
    await page.click('canvas', { position: { x: 50, y: 50 } })
    
    // Verify deselection
    await expect(page.locator('[data-testid="sticky-note"]')).not.toHaveClass(/selected/)
  })

  test('should handle sticky note keyboard navigation', async () => {
    // Create multiple sticky notes
    await page.click('[data-testid="add-sticky-note"]')
    await page.click('canvas', { position: { x: 100, y: 100 } })
    await page.fill('[data-testid="sticky-note-input"]', 'Note 1')
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    await page.click('[data-testid="add-sticky-note"]')
    await page.click('canvas', { position: { x: 200, y: 200 } })
    await page.fill('[data-testid="sticky-note-input"]', 'Note 2')
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Use Tab to navigate between sticky notes
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="sticky-note"]:focus')).toBeVisible()

    // Use Shift+Tab to navigate backwards
    await page.keyboard.press('Shift+Tab')
    await expect(page.locator('[data-testid="sticky-note"]:focus')).toBeVisible()
  })

  test('should handle sticky note copy and paste', async () => {
    // Create a sticky note
    await page.click('[data-testid="add-sticky-note"]')
    await page.click('canvas', { position: { x: 100, y: 100 } })
    await page.fill('[data-testid="sticky-note-input"]', 'Copy me')
    await page.press('[data-testid="sticky-note-input"]', 'Enter')

    // Select and copy sticky note
    await page.click('[data-testid="sticky-note"]')
    await page.keyboard.press('Control+c')

    // Paste sticky note
    await page.keyboard.press('Control+v')

    // Verify both sticky notes exist
    await expect(page.locator('[data-testid="sticky-note"]')).toHaveCount(2)
    await expect(page.locator('[data-testid="sticky-note"]:has-text("Copy me")')).toHaveCount(2)
  })
})
