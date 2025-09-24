import '@testing-library/jest-dom';

// Polyfill TextEncoder for Node.js environment
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock jsPDF for testing
jest.mock('jspdf', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      let pageCount = 1;
      return {
        text: jest.fn(),
        setFontSize: jest.fn(),
        setFont: jest.fn(),
        setTextColor: jest.fn(),
        setFillColor: jest.fn(),
        setDrawColor: jest.fn(),
        rect: jest.fn(),
        save: jest.fn(),
        output: jest.fn((format: string) => {
          if (format === 'datauristring') {
            return 'data:application/pdf;base64,mock-pdf-data-with-more-content-to-exceed-100-chars-for-testing-purposes';
          }
          if (format === 'arraybuffer') {
            return new ArrayBuffer(1024);
          }
          if (format === 'blob') {
            return new Blob(['mock-pdf-data'], { type: 'application/pdf' });
          }
          return 'mock-pdf-data';
        }),
        addPage: jest.fn(() => { pageCount++; }),
        setPage: jest.fn(),
        getNumberOfPages: jest.fn(() => pageCount),
        setProperties: jest.fn(),
        setCharSpace: jest.fn(),
        setLineWidth: jest.fn(),
        line: jest.fn(),
        internal: {
          pageSize: {
            getWidth: jest.fn(() => 595.28),
            getHeight: jest.fn(() => 841.89)
          },
          write: jest.fn()
        }
      };
    })
  };
});

// Mock browser APIs for integration tests
if (typeof URL.createObjectURL === 'undefined') {
  Object.defineProperty(URL, 'createObjectURL', {
    value: jest.fn(() => `blob:http://localhost:3000/${Math.random().toString(36).substr(2, 9)}`),
    writable: true
  });
}

if (typeof URL.revokeObjectURL === 'undefined') {
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: jest.fn(),
    writable: true
  });
}

// Mock document.createElement for download links
const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'a') {
    return {
      tagName: 'A',
      href: '',
      download: '',
      click: jest.fn(),
      addEventListener: jest.fn(),
      style: { display: 'none' }
    } as unknown as HTMLAnchorElement;
  }
         return originalCreateElement.call(document, tagName) as HTMLElement;
});
