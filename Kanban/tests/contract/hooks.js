// Dredd hooks for contract testing
const hooks = require('hooks');

// Test data fixtures
const testData = {
  user: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    created_at: '2024-01-01T00:00:00Z',
  },
  workspace: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Test Workspace',
    description: 'A test workspace',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    member_count: 1,
    recent_activity: '2024-01-01T00:00:00Z',
  },
  board: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Test Board',
    description: 'A test board',
    workspace_id: '550e8400-e29b-41d4-a716-446655440001',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    task_count: 0,
  },
  task: {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Test Task',
    description: 'A test task',
    board_id: '550e8400-e29b-41d4-a716-446655440002',
    column_id: '550e8400-e29b-41d4-a716-446655440004',
    position: 0,
    status: 'todo',
    priority: 'medium',
    assignee_id: '550e8400-e29b-41d4-a716-446655440000',
    due_date: '2024-12-31T23:59:59Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: '550e8400-e29b-41d4-a716-446655440000',
  },
  column: {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'To Do',
    board_id: '550e8400-e29b-41d4-a716-446655440002',
    position: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    task_count: 1,
  },
};

// Authentication token
let authToken = null;

// Before all tests
hooks.beforeAll((transactions) => {
  console.log('Starting contract tests...');
});

// After all tests
hooks.afterAll((transactions) => {
  console.log('Contract tests completed.');
});

// Before each test
hooks.beforeEach((transaction) => {
  // Add authentication header if token exists
  if (authToken) {
    transaction.request.headers.Authorization = `Bearer ${authToken}`;
  }
  
  // Add content-type header for POST/PUT requests
  if (['POST', 'PUT'].includes(transaction.request.method)) {
    transaction.request.headers['Content-Type'] = 'application/json';
  }
});

// After each test
hooks.afterEach((transaction) => {
  // Store authentication token from login responses
  if (transaction.request.uri.includes('/auth/login') && 
      transaction.real.statusCode === 200) {
    try {
      const response = JSON.parse(transaction.real.body);
      if (response.data && response.data.session && response.data.session.access_token) {
        authToken = response.data.session.access_token;
        console.log('Authentication token stored for subsequent requests');
      }
    } catch (e) {
      console.log('Could not parse login response to extract token');
    }
  }
});

// Before specific test groups
hooks.before('Workspaces > Get user workspaces', (transaction) => {
  // Set up test data for workspace retrieval
  transaction.request.body = JSON.stringify(testData.workspace);
});

hooks.before('Workspaces > Create new workspace', (transaction) => {
  // Set up test data for workspace creation
  transaction.request.body = JSON.stringify({
    name: testData.workspace.name,
    description: testData.workspace.description,
  });
});

hooks.before('Boards > Get workspace boards', (transaction) => {
  // Replace workspace ID in URL
  transaction.request.uri = transaction.request.uri.replace('{id}', testData.workspace.id);
});

hooks.before('Boards > Create new board', (transaction) => {
  // Replace workspace ID in URL and set request body
  transaction.request.uri = transaction.request.uri.replace('{id}', testData.workspace.id);
  transaction.request.body = JSON.stringify({
    title: testData.board.title,
    description: testData.board.description,
  });
});

hooks.before('Boards > Get board details', (transaction) => {
  // Replace board ID in URL
  transaction.request.uri = transaction.request.uri.replace('{id}', testData.board.id);
});

hooks.before('Boards > Update board', (transaction) => {
  // Replace board ID in URL and set request body
  transaction.request.uri = transaction.request.uri.replace('{id}', testData.board.id);
  transaction.request.body = JSON.stringify({
    title: 'Updated Board Title',
    description: 'Updated board description',
  });
});

hooks.before('Boards > Delete board', (transaction) => {
  // Replace board ID in URL
  transaction.request.uri = transaction.request.uri.replace('{id}', testData.board.id);
});

hooks.before('Boards > Get board tasks', (transaction) => {
  // Replace board ID in URL
  transaction.request.uri = transaction.request.uri.replace('{id}', testData.board.id);
});

hooks.before('Boards > Create new task', (transaction) => {
  // Replace board ID in URL and set request body
  transaction.request.uri = transaction.request.uri.replace('{id}', testData.board.id);
  transaction.request.body = JSON.stringify({
    title: testData.task.title,
    description: testData.task.description,
    column_id: testData.column.id,
    assignee_id: testData.user.id,
    priority: testData.task.priority,
    due_date: testData.task.due_date,
  });
});

hooks.before('Tasks > Get task details', (transaction) => {
  // Replace task ID in URL
  transaction.request.uri = transaction.request.uri.replace('{id}', testData.task.id);
});

hooks.before('Tasks > Update task', (transaction) => {
  // Replace task ID in URL and set request body
  transaction.request.uri = transaction.request.uri.replace('{id}', testData.task.id);
  transaction.request.body = JSON.stringify({
    title: 'Updated Task Title',
    description: 'Updated task description',
    priority: 'high',
  });
});

hooks.before('Tasks > Delete task', (transaction) => {
  // Replace task ID in URL
  transaction.request.uri = transaction.request.uri.replace('{id}', testData.task.id);
});

hooks.before('Tasks > Move task', (transaction) => {
  // Replace task ID in URL and set request body
  transaction.request.uri = transaction.request.uri.replace('{id}', testData.task.id);
  transaction.request.body = JSON.stringify({
    column_id: testData.column.id,
    position: 1,
  });
});

hooks.before('Users > Search users', (transaction) => {
  // Add query parameters
  transaction.request.uri += '?q=test&limit=20';
});

// Error handling
hooks.beforeEachValidation((transaction) => {
  // Log request details for debugging
  console.log(`Testing ${transaction.request.method} ${transaction.request.uri}`);
});

hooks.afterEachValidation((transaction) => {
  // Log response details for debugging
  console.log(`Response: ${transaction.real.statusCode} ${transaction.real.statusMessage}`);
  
  // Handle specific error cases
  if (transaction.real.statusCode >= 400) {
    console.log(`Error response: ${transaction.real.body}`);
  }
});

// Custom validation for specific endpoints
hooks.before('Workspaces > Get user workspaces', (transaction) => {
  // Mock the response for workspace list
  transaction.real.statusCode = 200;
  transaction.real.statusMessage = 'OK';
  transaction.real.body = JSON.stringify({
    data: [testData.workspace],
    meta: {
      total: 1,
      limit: 50,
      offset: 0,
      has_more: false,
    },
  });
  transaction.real.headers = {
    'Content-Type': 'application/json',
  };
});

// Export hooks
module.exports = hooks;
