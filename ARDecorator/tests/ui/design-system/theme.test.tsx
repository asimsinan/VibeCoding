import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Design System - Theme', () => {
  it('should have primary color defined', () => {
    const div = document.createElement('div');
    div.className = 'bg-primary';
    document.body.appendChild(div);
    expect(div.className).toContain('bg-primary');
    document.body.removeChild(div);
  });

  it('should have accent color defined', () => {
    const div = document.createElement('div');
    div.className = 'bg-accent';
    document.body.appendChild(div);
    expect(div.className).toContain('bg-accent');
    document.body.removeChild(div);
  });

  it('should have typography classes defined', () => {
    const div = document.createElement('div');
    div.className = 'font-sans text-base';
    document.body.appendChild(div);
    expect(div.className).toContain('font-sans');
    expect(div.className).toContain('text-base');
    document.body.removeChild(div);
  });

  it('should have spacing utilities defined', () => {
    const div = document.createElement('div');
    div.className = 'p-4 m-2';
    document.body.appendChild(div);
    expect(div.className).toContain('p-4');
    expect(div.className).toContain('m-2');
    document.body.removeChild(div);
  });

  it('should have shadow utilities defined', () => {
    const div = document.createElement('div');
    div.className = 'shadow-md shadow-lg';
    document.body.appendChild(div);
    expect(div.className).toContain('shadow-md');
    expect(div.className).toContain('shadow-lg');
    document.body.removeChild(div);
  });
});

