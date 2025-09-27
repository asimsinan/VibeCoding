import '@testing-library/jest-dom';
import { mockedAxiosInstance, resetMockedAxios } from './e2e/mockAxios'; // Import centralized mock

// Mock axios globally for all tests
jest.mock('axios', () => ({
  create: jest.fn(() => mockedAxiosInstance),
}));

// Mock window.matchMedia only if window exists
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Reset mocks before each test
beforeEach(() => {
  resetMockedAxios();
});
