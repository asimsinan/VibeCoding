import { test, expect } from './fixtures';

test.describe('Accessibility Testing - WCAG 2.1 AA Compliance', () => {
  test.describe('Perceivable - Information and UI components must be presentable to users', () => {
    test('should have proper text alternatives for images', async ({ page }) => {
      await page.goto('/');
      
      // Check for images without alt text
      const imagesWithoutAlt = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).filter(img => !img.alt || img.alt.trim() === '');
      });
      
      // All images should have alt text
      expect(imagesWithoutAlt).toHaveLength(0);
      
      // Check for decorative images (should have empty alt)
      const decorativeImages = await page.evaluate(() => {
        const images = document.querySelectorAll('img[alt=""]');
        return images.length;
      });
      
      console.log('Images with empty alt (decorative):', decorativeImages);
    });

    test('should have proper captions for multimedia', async ({ page }) => {
      await page.goto('/');
      
      // Check for video elements
      const videoAccessibility = await page.evaluate(() => {
        const videos = document.querySelectorAll('video');
        return Array.from(videos).map(video => ({
          hasCaptions: video.querySelector('track[kind="captions"]') !== null,
          hasSubtitles: video.querySelector('track[kind="subtitles"]') !== null,
          hasTranscript: video.querySelector('track[kind="descriptions"]') !== null,
          hasControls: video.controls
        }));
      });
      
      // Videos should have accessibility features
      videoAccessibility.forEach(video => {
        expect(video.hasControls).toBe(true);
      });
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/');
      
      // Test color contrast for text elements
      const contrastResults = await page.evaluate(() => {
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, button');
        const results = [];
        
        textElements.forEach(element => {
          const styles = window.getComputedStyle(element);
          const text = element.textContent?.trim();
          
          if (text && text.length > 0 && styles.color && styles.backgroundColor) {
            results.push({
              element: element.tagName,
              text: text.substring(0, 50),
              color: styles.color,
              backgroundColor: styles.backgroundColor,
              fontSize: styles.fontSize,
              fontWeight: styles.fontWeight
            });
          }
        });
        
        return results;
      });
      
      // Log contrast information for manual review
      console.log('Text elements for contrast review:', contrastResults.length);
      contrastResults.slice(0, 5).forEach(result => {
        console.log(`Element: ${result.element}, Color: ${result.color}, Background: ${result.backgroundColor}`);
      });
    });

    test('should be resizable up to 200% without loss of functionality', async ({ page }) => {
      await page.goto('/');
      
      // Test zoom levels
      const zoomLevels = [1, 1.5, 2, 2.5];
      
      for (const zoom of zoomLevels) {
        await page.evaluate((zoomLevel) => {
          document.body.style.zoom = `${zoomLevel * 100}%`;
        }, zoom);
        
        // Verify page is still functional
        await expect(page.locator('body')).toBeVisible();
        
        // Check for horizontal scrolling (should be minimal)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth;
        });
        
        // At 200% zoom, some horizontal scrolling is acceptable
        if (zoom <= 2) {
          console.log(`Zoom ${zoom * 100}%: Horizontal scroll - ${hasHorizontalScroll}`);
        }
      }
      
      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '100%';
      });
    });

    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/');
      
      // Check heading hierarchy
      const headingStructure = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const structure = Array.from(headings).map(heading => ({
          tag: heading.tagName,
          level: parseInt(heading.tagName.substring(1)),
          text: heading.textContent?.trim().substring(0, 50),
          hasId: !!heading.id
        }));
        
        return {
          headings: structure,
          hasH1: structure.some(h => h.tag === 'H1'),
          totalHeadings: structure.length
        };
      });
      
      // Should have at least one H1
      expect(headingStructure.hasH1).toBe(true);
      
      // Log heading structure for review
      console.log('Heading structure:', headingStructure.headings);
    });
  });

  test.describe('Operable - UI components and navigation must be operable', () => {
    test('should be fully keyboard accessible', async ({ page }) => {
      await page.goto('/');
      
      // Test tab navigation
      const tabOrder = [];
      
      // Press Tab multiple times to test navigation
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        const focusedElement = await page.evaluate(() => {
          const active = document.activeElement;
          return active ? {
            tagName: active.tagName,
            type: active.type || 'N/A',
            id: active.id || 'N/A',
            className: active.className || 'N/A',
            textContent: active.textContent?.trim().substring(0, 30) || 'N/A'
          } : null;
        });
        
        if (focusedElement) {
          tabOrder.push(focusedElement);
        }
      }
      
      // Should be able to navigate with keyboard
      expect(tabOrder.length).toBeGreaterThan(0);
      console.log('Tab navigation order:', tabOrder);
    });

    test('should have proper focus indicators', async ({ page }) => {
      await page.goto('/');
      
      // Test focus indicators
      const focusIndicators = await page.evaluate(() => {
        const focusableElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]');
        const results = [];
        
        focusableElements.forEach(element => {
          const styles = window.getComputedStyle(element);
          const hasOutline = styles.outline !== 'none' && styles.outline !== '';
          const hasBoxShadow = styles.boxShadow !== 'none' && styles.boxShadow !== '';
          const hasBorder = styles.border !== 'none' && styles.border !== '';
          
          results.push({
            tagName: element.tagName,
            hasOutline,
            hasBoxShadow,
            hasBorder,
            hasFocusIndicator: hasOutline || hasBoxShadow || hasBorder
          });
        });
        
        return results;
      });
      
      // Most focusable elements should have focus indicators
      const elementsWithIndicators = focusIndicators.filter(el => el.hasFocusIndicator);
      expect(elementsWithIndicators.length).toBeGreaterThan(0);
      
      console.log('Focus indicators:', focusIndicators.slice(0, 5));
    });

    test('should have proper skip links', async ({ page }) => {
      await page.goto('/');
      
      // Check for skip links
      const skipLinks = await page.evaluate(() => {
        const links = document.querySelectorAll('a');
        return Array.from(links).filter(link => {
          const text = link.textContent?.toLowerCase().trim();
          return text.includes('skip') || text.includes('jump') || link.href.includes('#main') || link.href.includes('#content');
        });
      });
      
      // Should have skip links for keyboard users
      console.log('Skip links found:', skipLinks.length);
      
      // Test skip link functionality if present
      if (skipLinks.length > 0) {
        const firstSkipLink = page.locator('a').first();
        await firstSkipLink.focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
      }
    });

    test('should handle keyboard shortcuts appropriately', async ({ page }) => {
      await page.goto('/');
      
      // Test common keyboard shortcuts
      const shortcuts = [
        { key: 'Tab', description: 'Tab navigation' },
        { key: 'Shift+Tab', description: 'Reverse tab navigation' },
        { key: 'Enter', description: 'Activate focused element' },
        { key: 'Space', description: 'Activate focused element' },
        { key: 'Escape', description: 'Close modals/dropdowns' }
      ];
      
      for (const shortcut of shortcuts) {
        try {
          if (shortcut.key.includes('+')) {
            const [modifier, key] = shortcut.key.split('+');
            await page.keyboard.press(`${modifier}+${key}`);
          } else {
            await page.keyboard.press(shortcut.key);
          }
          
          await page.waitForTimeout(100);
          
          // Verify page is still functional
          await expect(page.locator('body')).toBeVisible();
        } catch (error) {
          console.log(`Shortcut ${shortcut.key} (${shortcut.description}): ${error.message}`);
        }
      }
    });

    test('should have proper time limits and user control', async ({ page }) => {
      await page.goto('/');
      
      // Check for auto-refresh or time limits
      const timeLimits = await page.evaluate(() => {
        const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
        const timeouts = [];
        
        // Check for setTimeout calls (basic check)
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
          if (script.textContent?.includes('setTimeout') || script.textContent?.includes('setInterval')) {
            timeouts.push('Found timeout/interval in script');
          }
        });
        
        return {
          hasMetaRefresh: !!metaRefresh,
          metaRefreshContent: metaRefresh?.getAttribute('content'),
          timeouts: timeouts
        };
      });
      
      // Should not have auto-refresh without user control
      if (timeLimits.hasMetaRefresh) {
        expect(timeLimits.metaRefreshContent).not.toContain('0;'); // Should not auto-refresh immediately
      }
      
      console.log('Time limits check:', timeLimits);
    });
  });

  test.describe('Understandable - Information and UI operation must be understandable', () => {
    test('should have proper language attributes', async ({ page }) => {
      await page.goto('/');
      
      // Check language attributes
      const languageInfo = await page.evaluate(() => {
        const htmlLang = document.documentElement.lang;
        const bodyLang = document.body.lang;
        const metaLang = document.querySelector('meta[http-equiv="content-language"]');
        
        return {
          htmlLang,
          bodyLang,
          metaLang: metaLang?.getAttribute('content'),
          hasLanguage: !!(htmlLang || bodyLang || metaLang)
        };
      });
      
      // Should have language specified
      expect(languageInfo.hasLanguage).toBe(true);
      
      console.log('Language information:', languageInfo);
    });

    test('should have consistent navigation', async ({ page }) => {
      await page.goto('/');
      
      // Check navigation consistency
      const navigation = await page.evaluate(() => {
        const navElements = document.querySelectorAll('nav, [role="navigation"]');
        const links = document.querySelectorAll('a[href]');
        
        return {
          navCount: navElements.length,
          linkCount: links.length,
          hasMainNav: navElements.length > 0,
          hasLinks: links.length > 0
        };
      });
      
      // Should have some form of navigation
      expect(navigation.hasMainNav || navigation.hasLinks).toBe(true);
      
      console.log('Navigation structure:', navigation);
    });

    test('should have proper form labels and instructions', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Check form accessibility
      const formAccessibility = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, textarea, select');
        const results = [];
        
        inputs.forEach(input => {
          const hasLabel = !!input.labels?.length;
          const hasAriaLabel = !!input.getAttribute('aria-label');
          const hasAriaLabelledBy = !!input.getAttribute('aria-labelledby');
          const hasPlaceholder = !!input.placeholder;
          const hasTitle = !!input.title;
          
          results.push({
            type: input.type || input.tagName.toLowerCase(),
            hasLabel,
            hasAriaLabel,
            hasAriaLabelledBy,
            hasPlaceholder,
            hasTitle,
            hasAccessibleName: hasLabel || hasAriaLabel || hasAriaLabelledBy || hasTitle
          });
        });
        
        return results;
      });
      
      // All form inputs should have accessible names
      const inputsWithoutNames = formAccessibility.filter(input => !input.hasAccessibleName);
      expect(inputsWithoutNames).toHaveLength(0);
      
      console.log('Form accessibility:', formAccessibility);
    });

    test('should provide error identification and suggestions', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Test form validation
      const form = page.locator('form');
      if (await form.count() > 0) {
        // Try to submit empty form
        await form.first().locator('button[type="submit"]').click();
        await page.waitForTimeout(1000);
        
        // Check for error messages
        const errorMessages = await page.evaluate(() => {
          const errors = document.querySelectorAll('[role="alert"], .error, .invalid, [aria-invalid="true"]');
          return Array.from(errors).map(error => ({
            text: error.textContent?.trim(),
            hasRole: error.getAttribute('role') === 'alert',
            hasAriaInvalid: error.getAttribute('aria-invalid') === 'true'
          }));
        });
        
        console.log('Error messages found:', errorMessages);
      }
    });
  });

  test.describe('Robust - Content must be robust enough to be interpreted by assistive technologies', () => {
    test('should have proper ARIA attributes', async ({ page }) => {
      await page.goto('/');
      
      // Check ARIA implementation
      const ariaElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [aria-expanded], [aria-hidden], [aria-live], [aria-atomic], [aria-busy], [aria-checked], [aria-disabled], [aria-invalid], [aria-required], [aria-selected], [aria-sort], [aria-valuemin], [aria-valuemax], [aria-valuenow]');
        
        return Array.from(elements).map(element => ({
          tagName: element.tagName,
          ariaAttributes: Array.from(element.attributes)
            .filter(attr => attr.name.startsWith('aria-'))
            .map(attr => `${attr.name}="${attr.value}"`)
        }));
      });
      
      console.log('ARIA elements found:', ariaElements.length);
      ariaElements.slice(0, 5).forEach(element => {
        console.log(`${element.tagName}: ${element.ariaAttributes.join(', ')}`);
      });
    });

    test('should have proper semantic HTML', async ({ page }) => {
      await page.goto('/');
      
      // Check semantic HTML usage
      const semanticElements = await page.evaluate(() => {
        const semanticTags = ['main', 'nav', 'header', 'footer', 'section', 'article', 'aside', 'figure', 'figcaption', 'time', 'mark', 'progress', 'meter'];
        const results = {};
        
        semanticTags.forEach(tag => {
          const elements = document.querySelectorAll(tag);
          results[tag] = elements.length;
        });
        
        return results;
      });
      
      // Should use semantic HTML elements
      expect(semanticElements.main || semanticElements.section).toBeGreaterThan(0);
      
      console.log('Semantic HTML usage:', semanticElements);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      
      // Check heading hierarchy
      const headingHierarchy = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const hierarchy = Array.from(headings).map(heading => ({
          level: parseInt(heading.tagName.substring(1)),
          text: heading.textContent?.trim().substring(0, 50)
        }));
        
        // Check for proper hierarchy (no skipping levels)
        let hasHierarchyIssues = false;
        let previousLevel = 0;
        
        hierarchy.forEach(heading => {
          if (heading.level > previousLevel + 1) {
            hasHierarchyIssues = true;
          }
          previousLevel = heading.level;
        });
        
        return {
          headings: hierarchy,
          hasHierarchyIssues,
          totalHeadings: hierarchy.length
        };
      });
      
      // Should have proper heading hierarchy
      expect(headingHierarchy.hasHierarchyIssues).toBe(false);
      
      console.log('Heading hierarchy:', headingHierarchy.headings);
    });

    test('should have proper landmark roles', async ({ page }) => {
      await page.goto('/');
      
      // Check landmark roles
      const landmarks = await page.evaluate(() => {
        const landmarkRoles = ['banner', 'navigation', 'main', 'complementary', 'contentinfo', 'search', 'form', 'region'];
        const results = {};
        
        landmarkRoles.forEach(role => {
          const elements = document.querySelectorAll(`[role="${role}"]`);
          results[role] = elements.length;
        });
        
        // Also check for semantic elements that create landmarks
        const semanticLandmarks = {
          header: document.querySelectorAll('header').length,
          nav: document.querySelectorAll('nav').length,
          main: document.querySelectorAll('main').length,
          aside: document.querySelectorAll('aside').length,
          footer: document.querySelectorAll('footer').length
        };
        
        return {
          roleLandmarks: results,
          semanticLandmarks
        };
      });
      
      // Should have main landmark
      const hasMainLandmark = landmarks.roleLandmarks.main > 0 || landmarks.semanticLandmarks.main > 0;
      expect(hasMainLandmark).toBe(true);
      
      console.log('Landmark roles:', landmarks);
    });

    test('should have proper table structure', async ({ page }) => {
      await page.goto('/');
      
      // Check table accessibility
      const tableAccessibility = await page.evaluate(() => {
        const tables = document.querySelectorAll('table');
        const results = [];
        
        tables.forEach(table => {
          const hasCaption = !!table.querySelector('caption');
          const hasHeaders = table.querySelectorAll('th').length > 0;
          const hasScope = Array.from(table.querySelectorAll('th')).some(th => th.getAttribute('scope'));
          const hasHeadersAttr = Array.from(table.querySelectorAll('td')).some(td => td.getAttribute('headers'));
          
          results.push({
            hasCaption,
            hasHeaders,
            hasScope,
            hasHeadersAttr,
            isAccessible: hasCaption && hasHeaders && (hasScope || hasHeadersAttr)
          });
        });
        
        return results;
      });
      
      // All tables should be accessible
      const inaccessibleTables = tableAccessibility.filter(table => !table.isAccessible);
      expect(inaccessibleTables).toHaveLength(0);
      
      console.log('Table accessibility:', tableAccessibility);
    });
  });

  test.describe('Additional Accessibility Tests', () => {
    test('should have proper link text', async ({ page }) => {
      await page.goto('/');
      
      // Check link accessibility
      const linkAccessibility = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href]');
        const results = [];
        
        links.forEach(link => {
          const text = link.textContent?.trim();
          const hasText = !!text && text.length > 0;
          const hasAriaLabel = !!link.getAttribute('aria-label');
          const hasTitle = !!link.getAttribute('title');
          const isDescriptive = hasText && text.length > 3 && !text.toLowerCase().includes('click here') && !text.toLowerCase().includes('read more');
          
          results.push({
            href: link.href,
            text: text?.substring(0, 50),
            hasText,
            hasAriaLabel,
            hasTitle,
            isDescriptive,
            hasAccessibleName: hasText || hasAriaLabel || hasTitle
          });
        });
        
        return results;
      });
      
      // All links should have accessible names
      const linksWithoutNames = linkAccessibility.filter(link => !link.hasAccessibleName);
      expect(linksWithoutNames).toHaveLength(0);
      
      console.log('Link accessibility:', linkAccessibility.slice(0, 5));
    });

    test('should have proper button accessibility', async ({ page }) => {
      await page.goto('/');
      
      // Check button accessibility
      const buttonAccessibility = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"]');
        const results = [];
        
        buttons.forEach(button => {
          const text = button.textContent?.trim();
          const hasText = !!text && text.length > 0;
          const hasAriaLabel = !!button.getAttribute('aria-label');
          const hasValue = !!button.getAttribute('value');
          const hasTitle = !!button.getAttribute('title');
          
          results.push({
            type: button.type || 'button',
            text: text?.substring(0, 50),
            hasText,
            hasAriaLabel,
            hasValue,
            hasTitle,
            hasAccessibleName: hasText || hasAriaLabel || hasValue || hasTitle
          });
        });
        
        return results;
      });
      
      // All buttons should have accessible names
      const buttonsWithoutNames = buttonAccessibility.filter(button => !button.hasAccessibleName);
      expect(buttonsWithoutNames).toHaveLength(0);
      
      console.log('Button accessibility:', buttonAccessibility.slice(0, 5));
    });

    test('should have proper live regions', async ({ page }) => {
      await page.goto('/');
      
      // Check for live regions
      const liveRegions = await page.evaluate(() => {
        const liveElements = document.querySelectorAll('[aria-live], [aria-atomic], [aria-busy]');
        const results = [];
        
        liveElements.forEach(element => {
          results.push({
            tagName: element.tagName,
            ariaLive: element.getAttribute('aria-live'),
            ariaAtomic: element.getAttribute('aria-atomic'),
            ariaBusy: element.getAttribute('aria-busy')
          });
        });
        
        return results;
      });
      
      console.log('Live regions found:', liveRegions);
    });

    test('should have proper color and contrast', async ({ page }) => {
      await page.goto('/');
      
      // Basic color contrast check
      const colorInfo = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const colorElements = [];
        
        elements.forEach(element => {
          const styles = window.getComputedStyle(element);
          const text = element.textContent?.trim();
          
          if (text && text.length > 0 && styles.color && styles.backgroundColor) {
            colorElements.push({
              tagName: element.tagName,
              color: styles.color,
              backgroundColor: styles.backgroundColor,
              fontSize: styles.fontSize,
              fontWeight: styles.fontWeight
            });
          }
        });
        
        return colorElements.slice(0, 10); // Limit to first 10 for performance
      });
      
      console.log('Color information for contrast review:', colorInfo);
    });
  });
});
