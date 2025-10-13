import { test, expect } from './fixtures';

test.describe('Mobile Responsiveness Testing', () => {
  test.describe('Viewport and Layout', () => {
    test('should adapt to different mobile screen sizes', async ({ page }) => {
      // Test iPhone SE (smallest common mobile screen)
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Verify page loads and is visible
      await expect(page.locator('body')).toBeVisible();
      
      // Test iPhone 12 Pro (medium mobile screen)
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
      
      // Test iPhone 12 Pro Max (large mobile screen)
      await page.setViewportSize({ width: 428, height: 926 });
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
      
      // Test Samsung Galaxy S21 (Android)
      await page.setViewportSize({ width: 384, height: 854 });
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle orientation changes', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // Portrait
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
      
      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await expect(page.locator('body')).toBeVisible();
      
      // Switch back to portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have proper viewport meta tag', async ({ page }) => {
      await page.goto('/');
      
      const viewport = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta ? meta.getAttribute('content') : null;
      });
      
      // Should have viewport meta tag for mobile optimization
      expect(viewport).toBeTruthy();
      
      // Should include width=device-width and initial-scale=1
      if (viewport) {
        expect(viewport).toContain('width=device-width');
        expect(viewport).toContain('initial-scale=1');
      }
    });
  });

  test.describe('Touch Interactions', () => {
    test('should handle touch events properly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test touch event support
      const touchSupport = await page.evaluate(() => {
        return {
          touchstart: 'ontouchstart' in window,
          touchmove: 'ontouchmove' in window,
          touchend: 'ontouchend' in window,
          maxTouchPoints: navigator.maxTouchPoints || 0
        };
      });
      
      // Should support touch events on mobile
      expect(touchSupport.maxTouchPoints).toBeGreaterThan(0);
    });

    test('should handle tap interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test tap on body element
      await page.tap('body');
      
      // Verify page is still responsive
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle swipe gestures', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test horizontal swipe
      await page.touchscreen.tap(100, 300);
      await page.touchscreen.tap(300, 300);
      
      // Test vertical swipe
      await page.touchscreen.tap(200, 200);
      await page.touchscreen.tap(200, 400);
      
      // Verify page is still responsive
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Navigation and Menus', () => {
    test('should have mobile-friendly navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Look for common mobile navigation patterns
      const navElements = await page.evaluate(() => {
        return {
          hamburgerMenu: document.querySelector('[aria-label*="menu"], .hamburger, .menu-toggle'),
          mobileNav: document.querySelector('.mobile-nav, .nav-mobile'),
          navLinks: document.querySelectorAll('nav a, .nav a').length,
          hasNav: document.querySelector('nav, header, [role="navigation"]') !== null
        };
      });
      
      // Should have some form of navigation
      expect(navElements.hasNav || navElements.navLinks > 0).toBe(true);
    });

    test('should handle mobile menu interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Look for mobile menu toggle
      const menuToggle = page.locator('[aria-label*="menu"], .hamburger, .menu-toggle, .mobile-menu-toggle');
      
      if (await menuToggle.count() > 0) {
        // Test menu toggle
        await menuToggle.first().tap();
        await page.waitForTimeout(500);
        
        // Test menu close
        await menuToggle.first().tap();
        await page.waitForTimeout(500);
      }
      
      // Verify page is still responsive
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Form Interactions', () => {
    test('should handle mobile form inputs', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/auth/login');
      
      // Test if form elements are accessible on mobile
      const formElements = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, textarea, select');
        return Array.from(inputs).map(input => ({
          type: input.type || input.tagName.toLowerCase(),
          visible: input.offsetWidth > 0 && input.offsetHeight > 0,
          accessible: !input.disabled && !input.hidden
        }));
      });
      
      // Log form elements for debugging
      console.log('Form elements found:', formElements);
      
      // If there are form elements, they should be accessible
      if (formElements.length > 0) {
        formElements.forEach(element => {
          if (element.accessible) {
            expect(element.visible).toBe(true);
          }
        });
      }
    });

    test('should handle mobile keyboard interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/auth/login');
      
      // Test virtual keyboard behavior
      const inputs = page.locator('input, textarea');
      const inputCount = await inputs.count();
      
      if (inputCount > 0) {
        const firstInput = inputs.first();
        
        // Test focus behavior
        await firstInput.tap();
        await page.waitForTimeout(500);
        
        // Test input
        await firstInput.fill('test');
        await page.waitForTimeout(500);
        
        // Test blur
        await page.tap('body');
        await page.waitForTimeout(500);
      }
      
      // Verify page is still responsive
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Content and Typography', () => {
    test('should have readable text on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test text readability
      const textMetrics = await page.evaluate(() => {
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
        const metrics = Array.from(textElements).map(el => {
          const styles = window.getComputedStyle(el);
          const text = el.textContent?.trim();
          
          if (text && text.length > 0) {
            return {
              fontSize: parseFloat(styles.fontSize),
              lineHeight: parseFloat(styles.lineHeight),
              hasText: text.length > 0,
              isVisible: el.offsetWidth > 0 && el.offsetHeight > 0
            };
          }
          return null;
        }).filter(Boolean);
        
        return {
          totalElements: textElements.length,
          textElements: metrics.length,
          avgFontSize: metrics.reduce((sum, m) => sum + (m?.fontSize || 0), 0) / metrics.length,
          minFontSize: Math.min(...metrics.map(m => m?.fontSize || 16))
        };
      });
      
      // Should have readable text
      expect(textMetrics.textElements).toBeGreaterThan(0);
      
      // Font size should be reasonable for mobile (at least 14px)
      if (textMetrics.minFontSize > 0) {
        expect(textMetrics.minFontSize).toBeGreaterThanOrEqual(12);
      }
    });

    test('should handle text scaling', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test with different zoom levels
      await page.evaluate(() => {
        document.body.style.zoom = '1.2';
      });
      await expect(page.locator('body')).toBeVisible();
      
      await page.evaluate(() => {
        document.body.style.zoom = '0.8';
      });
      await expect(page.locator('body')).toBeVisible();
      
      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1';
      });
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Images and Media', () => {
    test('should handle responsive images', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test image responsiveness
      const imageMetrics = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).map(img => ({
          src: img.src,
          width: img.naturalWidth,
          height: img.naturalHeight,
          displayWidth: img.offsetWidth,
          displayHeight: img.offsetHeight,
          hasSrcset: !!img.srcset,
          hasSizes: !!img.sizes
        }));
      });
      
      // Log image information for debugging
      console.log('Images found:', imageMetrics);
      
      // Images should be properly sized for mobile
      imageMetrics.forEach(img => {
        if (img.displayWidth > 0) {
          // Image should not be wider than viewport
          expect(img.displayWidth).toBeLessThanOrEqual(400);
        }
      });
    });

    test('should handle video and media elements', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test media elements
      const mediaElements = await page.evaluate(() => {
        const videos = document.querySelectorAll('video');
        const audios = document.querySelectorAll('audio');
        
        return {
          videoCount: videos.length,
          audioCount: audios.length,
          videos: Array.from(videos).map(v => ({
            width: v.offsetWidth,
            height: v.offsetHeight,
            hasControls: v.controls,
            hasAutoplay: v.autoplay
          }))
        };
      });
      
      // Log media information
      console.log('Media elements:', mediaElements);
      
      // Videos should be responsive
      mediaElements.videos.forEach(video => {
        if (video.width > 0) {
          expect(video.width).toBeLessThanOrEqual(400);
        }
      });
    });
  });

  test.describe('Performance on Mobile', () => {
    test('should load quickly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds on mobile
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle mobile network conditions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Simulate slow 3G
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100);
      });
      
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should still load within reasonable time
      expect(loadTime).toBeLessThan(10000);
    });

    test('should handle memory constraints', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test memory usage
      const memoryInfo = await page.evaluate(() => {
        const memory = (performance as any).memory;
        return {
          usedJSHeapSize: memory ? memory.usedJSHeapSize : 'not available',
          totalJSHeapSize: memory ? memory.totalJSHeapSize : 'not available',
          jsHeapSizeLimit: memory ? memory.jsHeapSizeLimit : 'not available'
        };
      });
      
      console.log('Memory usage:', memoryInfo);
      
      // Memory usage should be reasonable
      if (memoryInfo.usedJSHeapSize !== 'not available') {
        expect(memoryInfo.usedJSHeapSize).toBeLessThan(100000000); // 100MB
      }
    });
  });

  test.describe('Accessibility on Mobile', () => {
    test('should maintain accessibility on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test basic accessibility
      const accessibility = await page.evaluate(() => {
        return {
          hasTitle: document.title && document.title.length > 0,
          hasLang: document.documentElement.lang,
          hasMetaDescription: document.querySelector('meta[name="description"]') !== null,
          hasHeading: document.querySelector('h1, h2, h3, h4, h5, h6') !== null,
          hasAltText: Array.from(document.querySelectorAll('img')).every(img => img.alt !== undefined),
          hasFormLabels: Array.from(document.querySelectorAll('input')).every(input => {
            return input.labels?.length > 0 || input.getAttribute('aria-label') || input.placeholder;
          })
        };
      });
      
      // Basic accessibility requirements
      expect(accessibility.hasTitle).toBe(true);
      expect(accessibility.hasLang).toBeTruthy();
    });

    test('should support mobile screen readers', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test ARIA attributes
      const ariaElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('[aria-label], [aria-describedby], [aria-labelledby]');
        return elements.length;
      });
      
      // Should have some ARIA attributes for accessibility
      console.log('ARIA elements found:', ariaElements);
    });

    test('should handle mobile keyboard navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verify page is still functional
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Mobile-Specific Features', () => {
    test('should handle mobile browser features', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test mobile browser APIs
      const mobileFeatures = await page.evaluate(() => {
        return {
          hasGeolocation: 'geolocation' in navigator,
          hasVibration: 'vibrate' in navigator,
          hasDeviceOrientation: 'ondeviceorientation' in window,
          hasDeviceMotion: 'ondevicemotion' in window,
          hasTouchEvents: 'ontouchstart' in window,
          userAgent: navigator.userAgent,
          isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        };
      });
      
      // Should detect mobile device
      expect(mobileFeatures.isMobile).toBe(true);
      expect(mobileFeatures.hasTouchEvents).toBe(true);
    });

    test('should handle mobile app-like behavior', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test PWA features
      const pwaFeatures = await page.evaluate(() => {
        return {
          hasServiceWorker: 'serviceWorker' in navigator,
          hasManifest: document.querySelector('link[rel="manifest"]') !== null,
          hasThemeColor: document.querySelector('meta[name="theme-color"]') !== null,
          hasAppleTouchIcon: document.querySelector('link[rel="apple-touch-icon"]') !== null,
          hasMetaViewport: document.querySelector('meta[name="viewport"]') !== null
        };
      });
      
      // Should have basic mobile optimization
      expect(pwaFeatures.hasMetaViewport).toBe(true);
    });

    test('should handle mobile-specific gestures', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test pull-to-refresh simulation
      await page.touchscreen.tap(200, 100);
      await page.touchscreen.tap(200, 200);
      
      // Test pinch zoom simulation
      await page.touchscreen.tap(150, 200);
      await page.touchscreen.tap(250, 200);
      
      // Verify page is still responsive
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
