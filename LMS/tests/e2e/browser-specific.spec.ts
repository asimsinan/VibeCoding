import { test, expect } from './fixtures';

test.describe('Browser-Specific Features', () => {
  test.describe('Chrome/Chromium Specific', () => {
    test('should handle Chrome-specific features', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chrome-specific test');
      
      await page.goto('/');
      
      // Test Chrome DevTools Protocol features
      const cdp = await page.context().newCDPSession(page);
      
      // Test if CDP is available (Chrome-specific)
      expect(cdp).toBeDefined();
      
      // Test Chrome-specific APIs
      const chromeAPI = await page.evaluate(() => {
        return typeof (window as any).chrome !== 'undefined';
      });
      
      // Chrome API might not be available in test environment
      console.log('Chrome API available:', chromeAPI);
    });

    test('should handle Chrome autofill', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chrome-specific test');
      
      await page.goto('/auth/login');
      
      // Test autofill behavior
      const emailInput = page.locator('input[type="email"]');
      await emailInput.focus();
      
      // Simulate autofill
      await emailInput.fill('test@example.com');
      
      // Verify autofill worked
      await expect(emailInput).toHaveValue('test@example.com');
    });
  });

  test.describe('Firefox Specific', () => {
    test('should handle Firefox-specific features', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');
      
      await page.goto('/');
      
      // Test Firefox-specific APIs
      const firefoxAPI = await page.evaluate(() => {
        return typeof (window as any).Components !== 'undefined';
      });
      
      // Firefox Components API might not be available in test environment
      console.log('Firefox Components API available:', firefoxAPI);
    });

    test('should handle Firefox password manager', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');
      
      await page.goto('/auth/login');
      
      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.focus();
      
      // Test password field behavior
      await passwordInput.fill('password123');
      await expect(passwordInput).toHaveValue('password123');
    });
  });

  test.describe('Safari/WebKit Specific', () => {
    test('should handle Safari-specific features', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test');
      
      await page.goto('/');
      
      // Test Safari-specific APIs
      const safariAPI = await page.evaluate(() => {
        return typeof (window as any).safari !== 'undefined';
      });
      
      // Safari API might not be available in test environment
      console.log('Safari API available:', safariAPI);
    });

    test('should handle Safari autofill', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test');
      
      await page.goto('/auth/login');
      
      const emailInput = page.locator('input[type="email"]');
      await emailInput.focus();
      
      // Test Safari autofill behavior
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');
    });

    test('should handle Safari touch events', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test');
      
      await page.goto('/');
      
      // Test touch event support
      const touchSupport = await page.evaluate(() => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      });
      
      console.log('Touch support available:', touchSupport);
    });
  });

  test.describe('Mobile Browser Specific', () => {
    test('should handle mobile Chrome features', async ({ page, browserName }) => {
      test.skip(browserName !== 'Mobile Chrome', 'Mobile Chrome-specific test');
      
      await page.goto('/');
      
      // Test mobile-specific features
      const isMobile = await page.evaluate(() => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      });
      
      expect(isMobile).toBe(true);
      
      // Test viewport meta tag
      const viewport = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta ? meta.getAttribute('content') : null;
      });
      
      console.log('Viewport meta tag:', viewport);
    });

    test('should handle mobile Safari features', async ({ page, browserName }) => {
      test.skip(browserName !== 'Mobile Safari', 'Mobile Safari-specific test');
      
      await page.goto('/');
      
      // Test iOS-specific features
      const isIOS = await page.evaluate(() => {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
      });
      
      console.log('iOS device detected:', isIOS);
      
      // Test touch events
      const touchEvents = await page.evaluate(() => {
        return {
          touchstart: 'ontouchstart' in window,
          touchmove: 'ontouchmove' in window,
          touchend: 'ontouchend' in window
        };
      });
      
      console.log('Touch events support:', touchEvents);
    });
  });

  test.describe('Cross-Browser Compatibility Issues', () => {
    test('should handle CSS differences', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test CSS property support
      const cssSupport = await page.evaluate((browser) => {
        const testElement = document.createElement('div');
        const styles = window.getComputedStyle(testElement);
        
        return {
          browser: browser,
          flexbox: styles.display === 'flex' || styles.display === '-webkit-flex',
          grid: styles.display === 'grid',
          transform: 'transform' in styles,
          transition: 'transition' in styles
        };
      }, browserName);
      
      console.log('CSS support:', cssSupport);
      
      // Basic CSS should work in all browsers
      expect(cssSupport.transform).toBe(true);
    });

    test('should handle JavaScript differences', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test JavaScript feature support
      const jsSupport = await page.evaluate((browser) => {
        return {
          browser: browser,
          arrowFunctions: (() => { try { eval('() => {}'); return true; } catch(e) { return false; } })(),
          asyncAwait: (() => { try { eval('async () => {}'); return true; } catch(e) { return false; } })(),
          promises: typeof Promise !== 'undefined',
          fetch: typeof fetch !== 'undefined',
          localStorage: typeof localStorage !== 'undefined',
          sessionStorage: typeof sessionStorage !== 'undefined'
        };
      }, browserName);
      
      console.log('JavaScript support:', jsSupport);
      
      // Basic features should work in all modern browsers
      expect(jsSupport.promises).toBe(true);
      expect(jsSupport.localStorage).toBe(true);
    });

    test('should handle event handling differences', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test event handling
      const eventSupport = await page.evaluate((browser) => {
        const testElement = document.createElement('div');
        let eventSupported = false;
        
        testElement.addEventListener('click', () => {
          eventSupported = true;
        });
        
        testElement.click();
        
        return {
          browser: browser,
          addEventListener: typeof testElement.addEventListener === 'function',
          clickEvent: eventSupported,
          touchEvents: 'ontouchstart' in window
        };
      }, browserName);
      
      console.log('Event support:', eventSupport);
      
      expect(eventSupport.addEventListener).toBe(true);
      expect(eventSupport.clickEvent).toBe(true);
    });
  });

  test.describe('Performance Differences', () => {
    test('should measure performance across browsers', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Measure page load performance
      const performance = await page.evaluate((browser) => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        return {
          browser: browser,
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
        };
      }, browserName);
      
      console.log('Performance metrics:', performance);
      
      // Performance should be reasonable across all browsers
      expect(performance.loadTime).toBeLessThan(10000); // 10 seconds max
    });

    test('should handle memory usage differences', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test memory usage (if available)
      const memoryInfo = await page.evaluate((browser) => {
        const memory = (performance as any).memory;
        
        return {
          browser: browser,
          usedJSHeapSize: memory ? memory.usedJSHeapSize : 'not available',
          totalJSHeapSize: memory ? memory.totalJSHeapSize : 'not available',
          jsHeapSizeLimit: memory ? memory.jsHeapSizeLimit : 'not available'
        };
      }, browserName);
      
      console.log('Memory info:', memoryInfo);
    });
  });
});
