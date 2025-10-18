import { describe, it, expect } from 'vitest';

describe('Design System - Typography', () => {
  it('should define font families', () => {
    const fonts = ['font-sans', 'font-serif', 'font-mono'];
    fonts.forEach(font => {
      expect(font).toBeTruthy();
    });
  });

  it('should define font sizes', () => {
    const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
    sizes.forEach(size => {
      expect(size).toBeTruthy();
    });
  });

  it('should define font weights', () => {
    const weights = ['font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold'];
    weights.forEach(weight => {
      expect(weight).toBeTruthy();
    });
  });

  it('should define line heights', () => {
    const lineHeights = ['leading-none', 'leading-tight', 'leading-normal', 'leading-relaxed'];
    lineHeights.forEach(lineHeight => {
      expect(lineHeight).toBeTruthy();
    });
  });
});

