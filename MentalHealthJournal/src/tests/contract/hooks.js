/**
 * Dredd hooks for contract testing
 * These hooks run before/after API requests during contract testing
 */

const hooks = require('hooks');

// Global setup
hooks.beforeAll((transactions) => {
  console.log('Starting contract tests...');
});

// Global teardown
hooks.afterAll((transactions) => {
  console.log('Contract tests completed.');
});

// Before each transaction
hooks.beforeEach((transaction) => {
  // Add authentication headers if needed
  if (transaction.request && transaction.request.headers) {
    transaction.request.headers['X-API-Key'] = 'test-api-key';
  }
});

// After each transaction
hooks.afterEach((transaction) => {
  // Log transaction results
  console.log(`${transaction.request.method} ${transaction.request.uri} - ${transaction.real.statusCode}`);
});

// Before specific endpoints
hooks.before('Mood Entries > Get mood entries > GET /mood-entries', (transaction) => {
  // Setup for mood entries retrieval
});

hooks.before('Mood Entries > Create mood entry > POST /mood-entries', (transaction) => {
  // Setup for mood entry creation
  if (transaction.request && transaction.request.body) {
    const body = JSON.parse(transaction.request.body);
    // Validate request body structure
    if (!body.rating || !body.date) {
      transaction.fail = 'Missing required fields: rating and date';
    }
    if (body.rating < 1 || body.rating > 10) {
      transaction.fail = 'Rating must be between 1 and 10';
    }
  }
});

hooks.before('Mood Trends > Get mood trends > GET /mood-trends', (transaction) => {
  // Setup for mood trends retrieval
});

hooks.before('User Settings > Get user settings > GET /user/settings', (transaction) => {
  // Setup for user settings retrieval
});

hooks.before('User Settings > Update user settings > PUT /user/settings', (transaction) => {
  // Setup for user settings update
  if (transaction.request && transaction.request.body) {
    const body = JSON.parse(transaction.request.body);
    // Validate request body structure
    if (body.theme && !['light', 'dark', 'auto'].includes(body.theme)) {
      transaction.fail = 'Invalid theme value';
    }
    if (body.dataRetention && (body.dataRetention < 30 || body.dataRetention > 3650)) {
      transaction.fail = 'Data retention must be between 30 and 3650 days';
    }
  }
});

// After specific endpoints
hooks.after('Mood Entries > Get mood entries > GET /mood-entries', (transaction) => {
  // Validate response structure
  if (transaction.real && transaction.real.body) {
    const response = JSON.parse(transaction.real.body);
    if (!response.success || !Array.isArray(response.data)) {
      transaction.fail = 'Invalid response structure for mood entries';
    }
  }
});

hooks.after('Mood Entries > Create mood entry > POST /mood-entries', (transaction) => {
  // Validate response structure
  if (transaction.real && transaction.real.body) {
    const response = JSON.parse(transaction.real.body);
    if (!response.success || !response.data || !response.data.id) {
      transaction.fail = 'Invalid response structure for mood entry creation';
    }
  }
});

hooks.after('Mood Trends > Get mood trends > GET /mood-trends', (transaction) => {
  // Validate response structure
  if (transaction.real && transaction.real.body) {
    const response = JSON.parse(transaction.real.body);
    if (!response.success || !response.data || !response.data.period) {
      transaction.fail = 'Invalid response structure for mood trends';
    }
  }
});

hooks.after('User Settings > Get user settings > GET /user/settings', (transaction) => {
  // Validate response structure
  if (transaction.real && transaction.real.body) {
    const response = JSON.parse(transaction.real.body);
    if (!response.success || !response.data || !response.data.id) {
      transaction.fail = 'Invalid response structure for user settings';
    }
  }
});

hooks.after('User Settings > Update user settings > PUT /user/settings', (transaction) => {
  // Validate response structure
  if (transaction.real && transaction.real.body) {
    const response = JSON.parse(transaction.real.body);
    if (!response.success || !response.data || !response.data.id) {
      transaction.fail = 'Invalid response structure for user settings update';
    }
  }
});

// Error handling
hooks.beforeEach((transaction) => {
  // Add error handling for network issues
  transaction.request.timeout = 5000;
});

hooks.afterEach((transaction) => {
  // Log errors if any
  if (transaction.fail) {
    console.error(`Transaction failed: ${transaction.fail}`);
  }
});
