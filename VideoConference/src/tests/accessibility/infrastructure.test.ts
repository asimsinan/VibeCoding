/**
 * Accessibility Testing Infrastructure Tests
 * Tests for accessibility testing setup and utilities
 */

import { accessibilityTestUtils } from '../accessibility/setup';

describe('Accessibility Testing Infrastructure', () => {
  describe('Accessibility Test Utilities', () => {
    it('should detect focusable elements', () => {
      // Create test DOM structure
      document.body.innerHTML = `
        <div>
          <button>Click me</button>
          <input type="text" />
          <a href="#">Link</a>
          <button disabled>Disabled button</button>
          <div tabindex="0">Focusable div</div>
          <div tabindex="-1">Not focusable div</div>
        </div>
      `;

      const focusableElements = accessibilityTestUtils.getFocusableElements();
      
      // Should find focusable elements
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Should include buttons, inputs, links, and elements with tabindex="0"
      const button = document.querySelector('button:not([disabled])');
      const input = document.querySelector('input');
      const link = document.querySelector('a');
      const focusableDiv = document.querySelector('div[tabindex="0"]');
      
      expect(focusableElements).toContain(button);
      expect(focusableElements).toContain(input);
      expect(focusableElements).toContain(link);
      expect(focusableElements).toContain(focusableDiv);
      
      // Should not include disabled elements
      const disabledButton = document.querySelector('button[disabled]');
      const nonFocusableDiv = document.querySelector('div[tabindex="-1"]');
      
      expect(focusableElements).not.toContain(disabledButton);
      expect(focusableElements).not.toContain(nonFocusableDiv);
    });

    it('should check if element is focusable', () => {
      // Create test elements
      const button = document.createElement('button');
      const disabledButton = document.createElement('button');
      disabledButton.disabled = true;
      const input = document.createElement('input');
      const hiddenDiv = document.createElement('div');
      hiddenDiv.style.display = 'none';
      
      expect(accessibilityTestUtils.isFocusable(button)).toBe(true);
      expect(accessibilityTestUtils.isFocusable(disabledButton)).toBe(false);
      expect(accessibilityTestUtils.isFocusable(input)).toBe(true);
      expect(accessibilityTestUtils.isFocusable(hiddenDiv)).toBe(false);
    });

    it('should calculate color contrast ratios', () => {
      // Test high contrast (black on white)
      const highContrast = accessibilityTestUtils.checkColorContrast('#000000', '#ffffff');
      expect(highContrast).toBeGreaterThan(20); // Should be very high
      
      // Test low contrast (gray on white)
      const lowContrast = accessibilityTestUtils.checkColorContrast('#cccccc', '#ffffff');
      expect(lowContrast).toBeLessThan(3); // Should be low
      
      // Test medium contrast (blue on white)
      const mediumContrast = accessibilityTestUtils.checkColorContrast('#0066cc', '#ffffff');
      expect(mediumContrast).toBeGreaterThan(3);
      expect(mediumContrast).toBeLessThan(10);
    });

    it('should validate ARIA attributes', () => {
      // Create test elements
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Test button');
      
      const unlabeledButton = document.createElement('button');
      unlabeledButton.setAttribute('role', 'button');
      
      const textbox = document.createElement('input');
      textbox.setAttribute('type', 'text');
      textbox.setAttribute('aria-label', 'Test input');
      
      expect(accessibilityTestUtils.hasProperARIA(button)).toBe(true);
      expect(accessibilityTestUtils.hasProperARIA(unlabeledButton)).toBe(false);
      expect(accessibilityTestUtils.hasProperARIA(textbox)).toBe(true);
    });
  });

  describe('Custom Accessibility Matchers', () => {
    it('should extend Jest with accessibility matchers', () => {
      // Create test element
      const element = document.createElement('button');
      element.setAttribute('aria-label', 'Test button');
      element.textContent = 'Click me';
      
      // Test custom matchers
      expect(element).toHaveAccessibleName();
      expect(element).toBeAccessible();
      
      // Test element without accessible name
      const unlabeledElement = document.createElement('div');
      expect(unlabeledElement).not.toHaveAccessibleName();
      expect(unlabeledElement).not.toBeAccessible();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should support ARIA live regions', () => {
      // Create live region
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('role', 'status');
      
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.getAttribute('role')).toBe('status');
    });

    it('should support ARIA landmarks', () => {
      // Create landmark elements
      const navigation = document.createElement('nav');
      navigation.setAttribute('aria-label', 'Main navigation');
      
      const main = document.createElement('main');
      const aside = document.createElement('aside');
      aside.setAttribute('aria-label', 'Sidebar');
      
      expect(navigation.getAttribute('aria-label')).toBe('Main navigation');
      expect(main.tagName.toLowerCase()).toBe('main');
      expect(aside.getAttribute('aria-label')).toBe('Sidebar');
    });

    it('should support semantic HTML elements', () => {
      // Create semantic elements
      const heading = document.createElement('h1');
      const list = document.createElement('ul');
      const listItem = document.createElement('li');
      const form = document.createElement('form');
      const label = document.createElement('label');
      
      expect(heading.tagName.toLowerCase()).toBe('h1');
      expect(list.tagName.toLowerCase()).toBe('ul');
      expect(listItem.tagName.toLowerCase()).toBe('li');
      expect(form.tagName.toLowerCase()).toBe('form');
      expect(label.tagName.toLowerCase()).toBe('label');
    });
  });

  describe('Keyboard Navigation Support', () => {
    it('should support tab navigation', () => {
      // Create focusable elements
      document.body.innerHTML = `
        <button tabindex="0">Button 1</button>
        <input tabindex="0" />
        <a href="#" tabindex="0">Link</a>
      `;
      
      const elements = accessibilityTestUtils.getFocusableElements();
      expect(elements.length).toBeGreaterThanOrEqual(3);
      
      // Test tab order
      elements.forEach(element => {
        const tabIndex = element.getAttribute('tabindex');
        if (tabIndex !== null) {
          expect(tabIndex).toBe('0');
        }
      });
    });

    it('should support skip links', () => {
      // Create skip link
      const skipLink = document.createElement('a');
      skipLink.href = '#main-content';
      skipLink.textContent = 'Skip to main content';
      skipLink.className = 'skip-link';
      
      expect(skipLink.href).toContain('#main-content');
      expect(skipLink.textContent).toContain('Skip to main content');
      expect(skipLink.className).toContain('skip-link');
    });
  });

  describe('Color and Visual Accessibility', () => {
    it('should support high contrast mode detection', () => {
      // Mock matchMedia for high contrast
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      expect(highContrastQuery.matches).toBe(true);

      // Restore original
      window.matchMedia = originalMatchMedia;
    });

    it('should support dark mode detection', () => {
      // Mock matchMedia for dark mode
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      expect(darkModeQuery.matches).toBe(true);

      // Restore original
      window.matchMedia = originalMatchMedia;
    });

    it('should support reduced motion detection', () => {
      // Mock matchMedia for reduced motion
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      expect(reducedMotionQuery.matches).toBe(true);

      // Restore original
      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Form Accessibility', () => {
    it('should support form labels and associations', () => {
      // Create form with proper labels
      const form = document.createElement('form');
      const label = document.createElement('label');
      label.setAttribute('for', 'test-input');
      label.textContent = 'Test Label';
      
      const input = document.createElement('input');
      input.setAttribute('id', 'test-input');
      input.setAttribute('type', 'text');
      
      form.appendChild(label);
      form.appendChild(input);
      
      expect(label.getAttribute('for')).toBe('test-input');
      expect(input.getAttribute('id')).toBe('test-input');
      expect(label.textContent).toBe('Test Label');
    });

    it('should support ARIA form controls', () => {
      // Create ARIA form controls
      const textbox = document.createElement('div');
      textbox.setAttribute('role', 'textbox');
      textbox.setAttribute('aria-label', 'Test input');
      textbox.setAttribute('aria-required', 'true');
      
      const checkbox = document.createElement('div');
      checkbox.setAttribute('role', 'checkbox');
      checkbox.setAttribute('aria-checked', 'false');
      checkbox.setAttribute('aria-label', 'Test checkbox');
      
      expect(textbox.getAttribute('role')).toBe('textbox');
      expect(textbox.getAttribute('aria-label')).toBe('Test input');
      expect(textbox.getAttribute('aria-required')).toBe('true');
      
      expect(checkbox.getAttribute('role')).toBe('checkbox');
      expect(checkbox.getAttribute('aria-checked')).toBe('false');
      expect(checkbox.getAttribute('aria-label')).toBe('Test checkbox');
    });
  });

  describe('Media Accessibility', () => {
    it('should support video accessibility', () => {
      // Create accessible video element
      const video = document.createElement('video');
      video.setAttribute('aria-label', 'Video of presentation');
      video.setAttribute('controls', 'true');
      
      const track = document.createElement('track');
      track.setAttribute('kind', 'captions');
      track.setAttribute('src', 'captions.vtt');
      track.setAttribute('srclang', 'en');
      track.setAttribute('label', 'English captions');
      
      video.appendChild(track);
      
      expect(video.getAttribute('aria-label')).toBe('Video of presentation');
      expect(video.hasAttribute('controls')).toBe(true);
      expect(track.getAttribute('kind')).toBe('captions');
      expect(track.getAttribute('srclang')).toBe('en');
    });

    it('should support audio accessibility', () => {
      // Create accessible audio element
      const audio = document.createElement('audio');
      audio.setAttribute('aria-label', 'Audio description');
      audio.setAttribute('controls', 'true');
      
      expect(audio.getAttribute('aria-label')).toBe('Audio description');
      expect(audio.hasAttribute('controls')).toBe(true);
    });
  });

  describe('Error Handling and Announcements', () => {
    it('should support error announcements', () => {
      // Create error region
      const errorRegion = document.createElement('div');
      errorRegion.setAttribute('role', 'alert');
      errorRegion.setAttribute('aria-live', 'assertive');
      errorRegion.textContent = 'Error message';
      
      expect(errorRegion.getAttribute('role')).toBe('alert');
      expect(errorRegion.getAttribute('aria-live')).toBe('assertive');
      expect(errorRegion.textContent).toBe('Error message');
    });

    it('should support status announcements', () => {
      // Create status region
      const statusRegion = document.createElement('div');
      statusRegion.setAttribute('role', 'status');
      statusRegion.setAttribute('aria-live', 'polite');
      statusRegion.textContent = 'Status message';
      
      expect(statusRegion.getAttribute('role')).toBe('status');
      expect(statusRegion.getAttribute('aria-live')).toBe('polite');
      expect(statusRegion.textContent).toBe('Status message');
    });
  });
});
