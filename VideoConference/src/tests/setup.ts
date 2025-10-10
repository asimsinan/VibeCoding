// Test setup file
const fetch = require('node-fetch');
const axios = require('axios');

// Polyfill fetch for Node.js environment
global.fetch = fetch;

// Configure axios defaults for testing
axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.timeout = 10000;

// Set up test environment variables
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'videoconference_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';
