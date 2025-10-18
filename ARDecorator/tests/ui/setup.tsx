import '@testing-library/jest-dom';
import React from 'react';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Make React available globally for tests
globalThis.React = React;

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

