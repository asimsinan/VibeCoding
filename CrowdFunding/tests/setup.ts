// Test setup file to handle Node.js environment issues
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder and TextDecoder for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  (global as any).TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  (global as any).TextDecoder = TextDecoder;
}

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Restore console for debugging when needed
global.originalConsole = originalConsole;