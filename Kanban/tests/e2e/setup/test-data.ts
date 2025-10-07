/**
 * E2E Test Data Setup
 * Provides test data and utilities for E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export interface TestWorkspace {
  name: string;
  description: string;
}

export interface TestBoard {
  title: string;
  description: string;
}

export interface TestTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
}

export interface TestColumn {
  title: string;
  position: number;
}

// Test user data
export const TEST_USERS = {
  admin: {
    email: 'admin@kanban-test.com',
    password: 'TestPassword123!',
    name: 'Admin User',
  },
  member: {
    email: 'member@kanban-test.com',
    password: 'TestPassword123!',
    name: 'Member User',
  },
  viewer: {
    email: 'viewer@kanban-test.com',
    password: 'TestPassword123!',
    name: 'Viewer User',
  },
} as const;

// Test workspace data
export const TEST_WORKSPACES = {
  primary: {
    name: 'E2E Test Workspace',
    description: 'A workspace for E2E testing purposes',
  },
  secondary: {
    name: 'Secondary Test Workspace',
    description: 'Another workspace for testing',
  },
} as const;

// Test board data
export const TEST_BOARDS = {
  projectAlpha: {
    title: 'Project Alpha Board',
    description: 'Main project board for Alpha development',
  },
  projectBeta: {
    title: 'Project Beta Board',
    description: 'Secondary project board for Beta features',
  },
} as const;

// Test column data
export const TEST_COLUMNS = [
  { title: 'To Do', position: 0 },
  { title: 'In Progress', position: 1 },
  { title: 'Review', position: 2 },
  { title: 'Done', position: 3 },
] as const;

// Test task data
export const TEST_TASKS = {
  highPriority: {
    title: 'Critical Bug Fix',
    description: 'Fix the critical authentication bug',
    priority: 'high' as const,
  },
  mediumPriority: {
    title: 'Feature Implementation',
    description: 'Implement new dashboard feature',
    priority: 'medium' as const,
  },
  lowPriority: {
    title: 'Documentation Update',
    description: 'Update API documentation',
    priority: 'low' as const,
  },
  withAssignee: {
    title: 'Code Review',
    description: 'Review pull request #123',
    priority: 'medium' as const,
    assignee: 'member@kanban-test.com',
  },
} as const;

// Test data generation utilities
export class TestDataGenerator {
  static generateRandomEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `test-${timestamp}-${random}@kanban-test.com`;
  }

  static generateRandomWorkspaceName(): string {
    const timestamp = Date.now();
    return `Test Workspace ${timestamp}`;
  }

  static generateRandomBoardTitle(): string {
    const timestamp = Date.now();
    return `Test Board ${timestamp}`;
  }

  static generateRandomTaskTitle(): string {
    const timestamp = Date.now();
    return `Test Task ${timestamp}`;
  }

  static generateTestUser(): TestUser {
    return {
      email: this.generateRandomEmail(),
      password: 'TestPassword123!',
      name: 'Test User',
    };
  }

  static generateTestWorkspace(): TestWorkspace {
    return {
      name: this.generateRandomWorkspaceName(),
      description: 'Generated test workspace',
    };
  }

  static generateTestBoard(): TestBoard {
    return {
      title: this.generateRandomBoardTitle(),
      description: 'Generated test board',
    };
  }

  static generateTestTask(): TestTask {
    return {
      title: this.generateRandomTaskTitle(),
      description: 'Generated test task',
      priority: 'medium',
    };
  }
}

// Test environment configuration
export const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiBaseUrl: 'http://localhost:3000/api/v1',
  supabaseUrl: 'https://rnugtlgygqbvtbklnmhn.supabase.co',
  testTimeout: 30000,
  actionTimeout: 10000,
  navigationTimeout: 30000,
} as const;

// Test selectors (CSS selectors for E2E tests)
export const SELECTORS = {
  // Authentication
  loginForm: '[data-testid="login-form"]',
  signupForm: '[data-testid="signup-form"]',
  emailInput: '[data-testid="email-input"]',
  passwordInput: '[data-testid="password-input"]',
  loginButton: '[data-testid="login-button"]',
  signupButton: '[data-testid="signup-button"]',
  logoutButton: '[data-testid="logout-button"]',

  // Navigation
  dashboardLink: '[data-testid="dashboard-link"]',
  workspacesLink: '[data-testid="workspaces-link"]',
  profileLink: '[data-testid="profile-link"]',

  // Workspace management
  workspaceList: '[data-testid="workspace-list"]',
  workspaceCard: '[data-testid="workspace-card"]',
  createWorkspaceButton: '[data-testid="create-workspace-button"]',
  createWorkspaceForm: '[data-testid="create-workspace-form"]',
  workspaceNameInput: '[data-testid="workspace-name-input"]',
  workspaceDescriptionInput: '[data-testid="workspace-description-input"]',
  workspaceSubmitButton: '[data-testid="workspace-submit-button"]',

  // Board management
  boardList: '[data-testid="board-list"]',
  boardCard: '[data-testid="board-card"]',
  createBoardButton: '[data-testid="create-board-button"]',
  createBoardForm: '[data-testid="create-board-form"]',
  boardTitleInput: '[data-testid="board-title-input"]',
  boardDescriptionInput: '[data-testid="board-description-input"]',
  boardSubmitButton: '[data-testid="board-submit-button"]',

  // Task management
  taskList: '[data-testid="task-list"]',
  taskCard: '[data-testid="task-card"]',
  createTaskButton: '[data-testid="create-task-button"]',
  createTaskForm: '[data-testid="create-task-form"]',
  taskTitleInput: '[data-testid="task-title-input"]',
  taskDescriptionInput: '[data-testid="task-description-input"]',
  taskPrioritySelect: '[data-testid="task-priority-select"]',
  taskAssigneeSelect: '[data-testid="task-assignee-select"]',
  taskSubmitButton: '[data-testid="task-submit-button"]',

  // Columns
  columnList: '[data-testid="column-list"]',
  columnHeader: '[data-testid="column-header"]',
  columnTitle: '[data-testid="column-title"]',
  addTaskToColumnButton: '[data-testid="add-task-to-column-button"]',

  // Drag and drop
  draggableTask: '[data-testid="draggable-task"]',
  droppableColumn: '[data-testid="droppable-column"]',
  dragHandle: '[data-testid="drag-handle"]',

  // Modals and overlays
  modal: '[data-testid="modal"]',
  modalOverlay: '[data-testid="modal-overlay"]',
  modalCloseButton: '[data-testid="modal-close-button"]',
  confirmButton: '[data-testid="confirm-button"]',
  cancelButton: '[data-testid="cancel-button"]',

  // Loading states
  loadingSpinner: '[data-testid="loading-spinner"]',
  loadingSkeleton: '[data-testid="loading-skeleton"]',

  // Error states
  errorMessage: '[data-testid="error-message"]',
  errorBoundary: '[data-testid="error-boundary"]',

  // Success messages
  successMessage: '[data-testid="success-message"]',
  toast: '[data-testid="toast"]',
} as const;

// Test URLs
export const TEST_URLS = {
  home: '/',
  login: '/auth/login',
  signup: '/auth/signup',
  dashboard: '/dashboard',
  workspaces: '/workspaces',
  profile: '/profile',
  workspace: (id: string) => `/workspaces/${id}`,
  board: (id: string) => `/boards/${id}`,
  task: (id: string) => `/tasks/${id}`,
} as const;
