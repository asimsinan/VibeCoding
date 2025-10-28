// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill for setImmediate
global.setImmediate = global.setImmediate || ((fn, ...args) => setTimeout(fn, 0, ...args));

// Mock pdf-parse to avoid ESM issues
jest.mock('pdf-parse', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({
    text: 'Mock PDF text content',
    numpages: 1,
  })),
}));

// Mock Next.js server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => data),
  },
}));

