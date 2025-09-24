/**
 * Polyfills for web testing
 * Sets up necessary polyfills before jsdom is loaded
 */

import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;
