#!/usr/bin/env node
/**
 * Polyfills for Jest environment
 * Provides Web APIs that are missing in Node.js environment
 */

// TextEncoder and TextDecoder polyfills
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Web Crypto API polyfill (minimal implementation)
if (!global.crypto) {
  global.crypto = {
    getRandomValues: (arr) => {
      const crypto = require('crypto');
      const bytes = crypto.randomBytes(arr.length);
      arr.set(bytes);
      return arr;
    },
    subtle: {
      // Minimal implementation for pg library
      digest: async (algorithm, data) => {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256');
        hash.update(data);
        return hash.digest();
      }
    }
  };
}

// Performance API polyfill
if (!global.performance) {
  global.performance = {
    now: () => Date.now()
  };
}

// URL polyfill (if needed)
if (!global.URL) {
  global.URL = require('url').URL;
}

console.log('✅ Polyfills loaded for Jest environment');
