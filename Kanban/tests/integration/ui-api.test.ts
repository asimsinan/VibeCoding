/**
 * UI-API Integration Tests
 * Tests the integration between UI components and API services
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from '../../src/lib/auth/components/LoginForm';
import { WorkspaceList } from '../../src/lib/workspace/components/WorkspaceList';
import { BoardView } from '../../src/lib/board/components/BoardView';
import { TaskCard } from '../../src/lib/task/components/TaskCard';
import { ErrorHandler } from '../../src/lib/ui/components/ErrorHandler';
import { TestDataFactory } from './setup';

// Mock the API services
jest.mock('../../src/lib/api/services/apiService', () => ({
  authApiService: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getCurrentUser: jest.fn(),
  },
  workspaceApiService: {
    getWorkspaces: jest.fn(),
    getWorkspace: jest.fn(),
    createWorkspace: jest.fn(),
    updateWorkspace: jest.fn(),
    deleteWorkspace: jest.fn(),
  },
  boardApiService: {
    getBoards: jest.fn(),
    getBoard: jest.fn(),
    createBoard: jest.fn(),
    updateBoard: jest.fn(),
    deleteBoard: jest.fn(),
    getColumns: jest.fn(),
  },
  taskApiService: {
    getTasks: jest.fn(),
    getTask: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    moveTask: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: () => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }),
    channel: () => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    }),
    removeChannel: jest.fn(),
  }),
}));

describe('UI-API Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      React.createElement(QueryClientProvider, { client: queryClient }, component)
    );
  };

  describe('Authentication Integration', () => {
    it('should handle successful login', async () => {
      const mockSignIn = require('../../src/lib/api/services/apiService').authApiService.signIn;
      mockSignIn.mockResolvedValue({
        success: true,
        data: {
          user: { id: '1', email: 'test@example.com' },
          session: { access_token: 'token123' },
        },
      });

      renderWithQueryClient(React.createElement(LoginForm));

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should handle login error', async () => {
      const mockSignIn = require('../../src/lib/api/services/apiService').authApiService.signIn;
      mockSignIn.mockRejectedValue({
        message: 'Invalid credentials',
        statusCode: 401,
      });

      renderWithQueryClient(React.createElement(LoginForm));

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });

  describe('Workspace Integration', () => {
    it('should display workspaces from API', async () => {
      const mockGetWorkspaces = require('../../src/lib/api/services/apiService').workspaceApiService.getWorkspaces;
      const mockWorkspaces = [
        { id: '1', name: 'Test Workspace', description: 'A test workspace' },
        { id: '2', name: 'Another Workspace', description: 'Another test workspace' },
      ];
      
      mockGetWorkspaces.mockResolvedValue({
        success: true,
        data: mockWorkspaces,
      });

      renderWithQueryClient(React.createElement(WorkspaceList));

      await waitFor(() => {
        expect(screen.getByText('Test Workspace')).toBeInTheDocument();
        expect(screen.getByText('Another Workspace')).toBeInTheDocument();
      });
    });

    it('should handle workspace loading state', () => {
      const mockGetWorkspaces = require('../../src/lib/api/services/apiService').workspaceApiService.getWorkspaces;
      mockGetWorkspaces.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithQueryClient(React.createElement(WorkspaceList));

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle workspace error state', async () => {
      const mockGetWorkspaces = require('../../src/lib/api/services/apiService').workspaceApiService.getWorkspaces;
      mockGetWorkspaces.mockRejectedValue({
        message: 'Failed to fetch workspaces',
        statusCode: 500,
      });

      renderWithQueryClient(React.createElement(WorkspaceList));

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch workspaces')).toBeInTheDocument();
      });
    });
  });

  describe('Board Integration', () => {
    it('should display board with columns and tasks', async () => {
      const mockGetBoard = require('../../src/lib/api/services/apiService').boardApiService.getBoard;
      const mockGetColumns = require('../../src/lib/api/services/apiService').boardApiService.getColumns;
      const mockGetTasks = require('../../src/lib/api/services/apiService').taskApiService.getTasks;

      const mockBoard = { id: '1', title: 'Test Board', description: 'A test board' };
      const mockColumns = [
        { id: '1', title: 'To Do', position: 0, board_id: '1' },
        { id: '2', title: 'In Progress', position: 1, board_id: '1' },
      ];
      const mockTasks = [
        { id: '1', title: 'Test Task', status: 'todo', priority: 'medium', column_id: '1', position: 0 },
      ];

      mockGetBoard.mockResolvedValue({ success: true, data: mockBoard });
      mockGetColumns.mockResolvedValue({ success: true, data: mockColumns });
      mockGetTasks.mockResolvedValue({ success: true, data: mockTasks });

      renderWithQueryClient(React.createElement(BoardView, { boardId: "1" }));

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
        expect(screen.getByText('To Do')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });
    });
  });

  describe('Task Integration', () => {
    it('should handle task creation', async () => {
      const mockCreateTask = require('../../src/lib/api/services/apiService').taskApiService.createTask;
      mockCreateTask.mockResolvedValue({
        success: true,
        data: { id: '1', title: 'New Task' },
      });

      const mockTask = {
        id: '1',
        title: 'Test Task',
        status: 'todo',
        priority: 'medium',
        column_id: '1',
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      renderWithQueryClient(
        React.createElement(TaskCard, { task: mockTask, onMove: jest.fn() })
      );

      // Test task editing
      const editButton = screen.getByTitle('Edit task');
      fireEvent.click(editButton);

      const titleInput = screen.getByDisplayValue('Test Task');
      fireEvent.change(titleInput, { target: { value: 'Updated Task' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreateTask).toHaveBeenCalled();
      });
    });

    it('should handle task deletion', async () => {
      const mockDeleteTask = require('../../src/lib/api/services/apiService').taskApiService.deleteTask;
      mockDeleteTask.mockResolvedValue({ success: true });

      const mockTask = {
        id: '1',
        title: 'Test Task',
        status: 'todo',
        priority: 'medium',
        column_id: '1',
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock window.confirm
      window.confirm = jest.fn(() => true);

      renderWithQueryClient(
        React.createElement(TaskCard, { task: mockTask, onMove: jest.fn() })
      );

      const deleteButton = screen.getByTitle('Delete task');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteTask).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should display error handler for API errors', () => {
      const mockError = {
        message: 'Network error',
        statusCode: 0,
      };

      renderWithQueryClient(
        React.createElement(ErrorHandler, { error: mockError, onRetry: jest.fn() })
      );

      expect(screen.getByText('Network error - please check your connection and try again.')).toBeInTheDocument();
    });

    it('should handle retry functionality', async () => {
      const mockRetry = jest.fn();
      const mockError = {
        message: 'Server error',
        statusCode: 500,
      };

      renderWithQueryClient(
        React.createElement(ErrorHandler, { error: mockError, onRetry: mockRetry })
      );

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalled();
    });

    it('should handle offline state', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const mockError = {
        message: 'Network error',
        statusCode: 0,
      };

      renderWithQueryClient(
        React.createElement(ErrorHandler, { error: mockError, onRetry: jest.fn() })
      );

      expect(screen.getByText('You are currently offline. Please check your internet connection and try again.')).toBeInTheDocument();
    });
  });

  describe('Data Flow Integration', () => {
    it('should update UI when data changes', async () => {
      const mockGetWorkspaces = require('../../src/lib/api/services/apiService').workspaceApiService.getWorkspaces;
      const mockWorkspaces = [
        { id: '1', name: 'Initial Workspace', description: 'Initial description' },
      ];
      
      mockGetWorkspaces.mockResolvedValue({
        success: true,
        data: mockWorkspaces,
      });

      const { rerender } = renderWithQueryClient(React.createElement(WorkspaceList));

      await waitFor(() => {
        expect(screen.getByText('Initial Workspace')).toBeInTheDocument();
      });

      // Update data
      const updatedWorkspaces = [
        { id: '1', name: 'Updated Workspace', description: 'Updated description' },
      ];
      
      mockGetWorkspaces.mockResolvedValue({
        success: true,
        data: updatedWorkspaces,
      });

      // Trigger refetch
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });

      await waitFor(() => {
        expect(screen.getByText('Updated Workspace')).toBeInTheDocument();
      });
    });
  });
});
