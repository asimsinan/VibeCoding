// Node-specific Jest setup: polyfills and globals for Node environment tests
import 'jest';

// Polyfill TextEncoder/TextDecoder for Node < 19 and libraries expecting them
// eslint-disable-next-line
const { TextEncoder, TextDecoder } = require('util');
if (typeof (global as any).TextEncoder === 'undefined') {
  (global as any).TextEncoder = TextEncoder;
}
if (typeof (global as any).TextDecoder === 'undefined') {
  (global as any).TextDecoder = TextDecoder;
}

// Ensure fetch is available in node tests that might call it
import 'whatwg-fetch';

// Increase default timeout for slower integration tests
jest.setTimeout(20000);

afterEach(() => {
  jest.clearAllMocks();
});


