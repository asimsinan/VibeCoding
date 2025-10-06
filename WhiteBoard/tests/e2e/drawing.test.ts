/**
 * Drawing E2E Tests
 * 
 * End-to-end tests for drawing functionality and tools.
 * Tests drawing tools, colors, sizes, and canvas interactions.
 */

import { test, expect, Page } from '@playwright/test'

test.describe('Drawing Functionality', () => {
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

  test('should allow drawing with pen tool', async () => {
    // Select pen tool
    await page.click('[data-testid="pen-tool"]')
    
    // Draw a line
    await page.mouse.move(100, 100)
    await page.mouse.down()
    await page.mouse.move(200, 200)
    await page.mouse.up()

    // Verify drawing was created
    await expect(page.locator('[data-testid="drawing-element"]')).toBeVisible()
  })

  test('should allow drawing with brush tool', async () => {
    // Select brush tool
    await page.click('[data-testid="brush-tool"]')
    
    // Draw with brush
    await page.mouse.move(150, 150)
    await page.mouse.down()
    await page.mouse.move(250, 250)
    await page.mouse.up()

    // Verify drawing was created
    await expect(page.locator('[data-testid="drawing-element"]')).toBeVisible()
  })

  test('should allow erasing drawings', async () => {
    // First draw something
    await page.click('[data-testid="pen-tool"]')
    await page.mouse.move(100, 100)
    await page.mouse.down()
    await page.mouse.move(200, 200)
    await page.mouse.up()

    // Verify drawing exists
    await expect(page.locator('[data-testid="drawing-element"]')).toBeVisible()

    // Switch to eraser and erase
    await page.click('[data-testid="eraser-tool"]')
    await page.mouse.move(150, 150)
    await page.mouse.down()
    await page.mouse.move(200, 200)
    await page.mouse.up()

    // Verify drawing was erased
    await expect(page.locator('[data-testid="drawing-element"]')).toHaveCount(0)
  })

  test('should allow changing drawing color', async () => {
    // Select pen tool
    await page.click('[data-testid="pen-tool"]')
    
    // Change color to red
    await page.click('[data-testid="color-picker"]')
    await page.fill('[data-testid="color-input"]', '#FF0000')
    await page.press('[data-testid="color-input"]', 'Enter')
    
    // Draw with red color
    await page.mouse.move(100, 100)
    await page.mouse.down()
    await page.mouse.move(200, 200)
    await page.mouse.up()

    // Verify drawing has red color
    const drawing = page.locator('[data-testid="drawing-element"]')
    await expect(drawing).toBeVisible()
    await expect(drawing).toHaveAttribute('stroke', '#FF0000')
  })

  test('should allow changing drawing size', async () => {
    // Select pen tool
    await page.click('[data-testid="pen-tool"]')
    
    // Change size to 10
    await page.fill('[data-testid="size-slider"]', '10')
    
    // Draw with larger size
    await page.mouse.move(100, 100)
    await page.mouse.down()
    await page.mouse.move(200, 200)
    await page.mouse.up()

    // Verify drawing has correct size
    const drawing = page.locator('[data-testid="drawing-element"]')
    await expect(drawing).toBeVisible()
    await expect(drawing).toHaveAttribute('stroke-width', '10')
  })

  test('should support keyboard shortcuts for tools', async () => {
    // Test pen tool shortcut (P)
    await page.press('body', 'KeyP')
    await page.mouse.move(100, 100)
    await page.mouse.down()
    await page.mouse.move(200, 200)
    await page.mouse.up()

    // Test brush tool shortcut (B)
    await page.press('body', 'KeyB')
    await page.mouse.move(150, 150)
    await page.mouse.down()
    await page.mouse.move(250, 250)
    await page.mouse.up()

    // Test eraser tool shortcut (E)
    await page.press('body', 'KeyE')
    await page.mouse.move(200, 200)
    await page.mouse.down()
    await page.mouse.move(250, 250)
    await page.mouse.up()

    // Verify drawings were created
    await expect(page.locator('[data-testid="drawing-element"]')).toHaveCount(2)
  })

  test('should support undo and redo functionality', async () => {
    // Draw something
    await page.click('[data-testid="pen-tool"]')
    await page.mouse.move(100, 100)
    await page.mouse.down()
    await page.mouse.move(200, 200)
    await page.mouse.up()

    // Verify drawing exists
    await expect(page.locator('[data-testid="drawing-element"]')).toBeVisible()

    // Undo the drawing
    await page.click('[data-testid="undo-button"]')
    await expect(page.locator('[data-testid="drawing-element"]')).toHaveCount(0)

    // Redo the drawing
    await page.click('[data-testid="redo-button"]')
    await expect(page.locator('[data-testid="drawing-element"]')).toBeVisible()
  })

  test('should support keyboard shortcuts for undo/redo', async () => {
    // Draw something
    await page.click('[data-testid="pen-tool"]')
    await page.mouse.move(100, 100)
    await page.mouse.down()
    await page.mouse.move(200, 200)
    await page.mouse.up()

    // Verify drawing exists
    await expect(page.locator('[data-testid="drawing-element"]')).toBeVisible()

    // Undo with Ctrl+Z
    await page.keyboard.press('Control+z')
    await expect(page.locator('[data-testid="drawing-element"]')).toHaveCount(0)

    // Redo with Ctrl+Y
    await page.keyboard.press('Control+y')
    await expect(page.locator('[data-testid="drawing-element"]')).toBeVisible()
  })

  test('should handle rapid drawing movements', async () => {
    // Select pen tool
    await page.click('[data-testid="pen-tool"]')
    
    // Perform rapid drawing movements
    await page.mouse.move(100, 100)
    await page.mouse.down()
    
    for (let i = 0; i < 50; i++) {
      await page.mouse.move(100 + i * 2, 100 + i * 2)
      await page.waitForTimeout(10)
    }
    
    await page.mouse.up()

    // Verify drawing was created
    await expect(page.locator('[data-testid="drawing-element"]')).toBeVisible()
  })

  test('should handle drawing outside canvas bounds', async () => {
    // Select pen tool
    await page.click('[data-testid="pen-tool"]')
    
    // Try to draw outside canvas bounds
    await page.mouse.move(-100, -100)
    await page.mouse.down()
    await page.mouse.move(1000, 1000)
    await page.mouse.up()

    // Drawing should be clipped to canvas bounds
    const drawing = page.locator('[data-testid="drawing-element"]')
    await expect(drawing).toBeVisible()
  })

  test('should support touch drawing on mobile devices', async () => {
    // Simulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Select pen tool
    await page.click('[data-testid="pen-tool"]')
    
    // Simulate touch drawing
    await page.touchscreen.tap(100, 100)
    await page.mouse.down()
    await page.mouse.move(200, 200)
    await page.mouse.up()

    // Verify drawing was created
    await expect(page.locator('[data-testid="drawing-element"]')).toBeVisible()
  })

  test('should handle drawing with different pressure levels', async () => {
    // Select brush tool (pressure sensitive)
    await page.click('[data-testid="brush-tool"]')
    
    // Draw with varying pressure
    await page.mouse.move(100, 100)
    await page.mouse.down()
    
    // Simulate pressure changes
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(100 + i * 10, 100 + i * 5)
      // Note: Real pressure simulation would require more complex setup
    }
    
    await page.mouse.up()

    // Verify drawing was created
    await expect(page.locator('[data-testid="drawing-element"]')).toBeVisible()
  })

  test('should support drawing with different opacity levels', async () => {
    // Select pen tool
    await page.click('[data-testid="pen-tool"]')
    
    // Change opacity to 50%
    await page.fill('[data-testid="opacity-slider"]', '0.5')
    
    // Draw with reduced opacity
    await page.mouse.move(100, 100)
    await page.mouse.down()
    await page.mouse.move(200, 200)
    await page.mouse.up()

    // Verify drawing has correct opacity
    const drawing = page.locator('[data-testid="drawing-element"]')
    await expect(drawing).toBeVisible()
    await expect(drawing).toHaveAttribute('opacity', '0.5')
  })
})
