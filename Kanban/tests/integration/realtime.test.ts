/**
 * Real-time Integration Tests
 * Tests Supabase Realtime integration with UI components
 */

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BoardView } from '../../src/lib/board/components/BoardView';
import { realtimeService } from '../../src/lib/api/realtime/realtimeService';

// Mock Supabase Realtime
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn(),
};

const mockSupabase = {
  channel: jest.fn(() => mockChannel),
  removeChannel: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));

// Mock API services
jest.mock('../../src/lib/api/services/apiService', () => ({
  boardApiService: {
    getBoard: jest.fn(),
    getColumns: jest.fn(),
  },
  taskApiService: {
    getTasks: jest.fn(),
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

describe('Real-time Integration Tests', () => {
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
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Real-time Subscriptions', () => {
    it('should subscribe to task changes when board loads', async () => {
      const mockGetBoard = require('../../src/lib/api/services/apiService').boardApiService.getBoard;
      const mockGetColumns = require('../../src/lib/api/services/apiService').boardApiService.getColumns;
      const mockGetTasks = require('../../src/lib/api/services/apiService').taskApiService.getTasks;

      mockGetBoard.mockResolvedValue({
        success: true,
        data: { id: '1', title: 'Test Board' },
      });
      mockGetColumns.mockResolvedValue({
        success: true,
        data: [{ id: '1', title: 'To Do', position: 0, board_id: '1' }],
      });
      mockGetTasks.mockResolvedValue({
        success: true,
        data: [],
      });

      renderWithQueryClient(<BoardView boardId="1" />);

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledWith('tasks');
        expect(mockSupabase.channel).toHaveBeenCalledWith('columns');
        expect(mockChannel.on).toHaveBeenCalledWith(
          'postgres_changes',
          expect.objectContaining({
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: 'board_id=eq.1',
          }),
          expect.any(Function)
        );
        expect(mockChannel.subscribe).toHaveBeenCalled();
      });
    });

    it('should handle task insertion events', async () => {
      const mockGetBoard = require('../../src/lib/api/services/apiService').boardApiService.getBoard;
      const mockGetColumns = require('../../src/lib/api/services/apiService').boardApiService.getColumns;
      const mockGetTasks = require('../../src/lib/api/services/apiService').taskApiService.getTasks;

      mockGetBoard.mockResolvedValue({
        success: true,
        data: { id: '1', title: 'Test Board' },
      });
      mockGetColumns.mockResolvedValue({
        success: true,
        data: [{ id: '1', title: 'To Do', position: 0, board_id: '1' }],
      });
      mockGetTasks.mockResolvedValue({
        success: true,
        data: [],
      });

      renderWithQueryClient(<BoardView boardId="1" />);

      await waitFor(() => {
        expect(mockChannel.on).toHaveBeenCalled();
      });

      // Simulate task insertion event
      const taskInsertHandler = mockChannel.on.mock.calls.find(
        call => call[1].table === 'tasks'
      )?.[2];

      if (taskInsertHandler) {
        const newTask = {
          id: '1',
          title: 'New Task',
          status: 'todo',
          priority: 'medium',
          column_id: '1',
          position: 0,
          board_id: '1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        taskInsertHandler({
          eventType: 'INSERT',
          new: newTask,
        });

        // Check if the task was added to the cache
        const cachedTasks = queryClient.getQueryData(['tasks', 'list', '1']);
        expect(cachedTasks).toContainEqual(newTask);
      }
    });

    it('should handle task update events', async () => {
      const mockGetBoard = require('../../src/lib/api/services/apiService').boardApiService.getBoard;
      const mockGetColumns = require('../../src/lib/api/services/apiService').boardApiService.getColumns;
      const mockGetTasks = require('../../src/lib/api/services/apiService').taskApiService.getTasks;

      const existingTask = {
        id: '1',
        title: 'Original Task',
        status: 'todo',
        priority: 'medium',
        column_id: '1',
        position: 0,
        board_id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockGetBoard.mockResolvedValue({
        success: true,
        data: { id: '1', title: 'Test Board' },
      });
      mockGetColumns.mockResolvedValue({
        success: true,
        data: [{ id: '1', title: 'To Do', position: 0, board_id: '1' }],
      });
      mockGetTasks.mockResolvedValue({
        success: true,
        data: [existingTask],
      });

      renderWithQueryClient(<BoardView boardId="1" />);

      await waitFor(() => {
        expect(mockChannel.on).toHaveBeenCalled();
      });

      // Simulate task update event
      const taskUpdateHandler = mockChannel.on.mock.calls.find(
        call => call[1].table === 'tasks'
      )?.[2];

      if (taskUpdateHandler) {
        const updatedTask = {
          ...existingTask,
          title: 'Updated Task',
          status: 'in_progress',
        };

        taskUpdateHandler({
          eventType: 'UPDATE',
          new: updatedTask,
          old: existingTask,
        });

        // Check if the task was updated in the cache
        const cachedTasks = queryClient.getQueryData(['tasks', 'list', '1']);
        expect(cachedTasks).toContainEqual(updatedTask);
        expect(cachedTasks).not.toContainEqual(existingTask);
      }
    });

    it('should handle task deletion events', async () => {
      const mockGetBoard = require('../../src/lib/api/services/apiService').boardApiService.getBoard;
      const mockGetColumns = require('../../src/lib/api/services/apiService').boardApiService.getColumns;
      const mockGetTasks = require('../../src/lib/api/services/apiService').taskApiService.getTasks;

      const existingTask = {
        id: '1',
        title: 'Task to Delete',
        status: 'todo',
        priority: 'medium',
        column_id: '1',
        position: 0,
        board_id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockGetBoard.mockResolvedValue({
        success: true,
        data: { id: '1', title: 'Test Board' },
      });
      mockGetColumns.mockResolvedValue({
        success: true,
        data: [{ id: '1', title: 'To Do', position: 0, board_id: '1' }],
      });
      mockGetTasks.mockResolvedValue({
        success: true,
        data: [existingTask],
      });

      renderWithQueryClient(<BoardView boardId="1" />);

      await waitFor(() => {
        expect(mockChannel.on).toHaveBeenCalled();
      });

      // Simulate task deletion event
      const taskDeleteHandler = mockChannel.on.mock.calls.find(
        call => call[1].table === 'tasks'
      )?.[2];

      if (taskDeleteHandler) {
        taskDeleteHandler({
          eventType: 'DELETE',
          old: existingTask,
        });

        // Check if the task was removed from the cache
        const cachedTasks = queryClient.getQueryData(['tasks', 'list', '1']);
        expect(cachedTasks).not.toContainEqual(existingTask);
      }
    });

    it('should unsubscribe when component unmounts', async () => {
      const mockGetBoard = require('../../src/lib/api/services/apiService').boardApiService.getBoard;
      const mockGetColumns = require('../../src/lib/api/services/apiService').boardApiService.getColumns;
      const mockGetTasks = require('../../src/lib/api/services/apiService').taskApiService.getTasks;

      mockGetBoard.mockResolvedValue({
        success: true,
        data: { id: '1', title: 'Test Board' },
      });
      mockGetColumns.mockResolvedValue({
        success: true,
        data: [{ id: '1', title: 'To Do', position: 0, board_id: '1' }],
      });
      mockGetTasks.mockResolvedValue({
        success: true,
        data: [],
      });

      const { unmount } = renderWithQueryClient(<BoardView boardId="1" />);

      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalled();
      });

      unmount();

      expect(mockSupabase.removeChannel).toHaveBeenCalled();
    });
  });

  describe('Real-time Error Handling', () => {
    it('should handle subscription errors gracefully', async () => {
      const mockGetBoard = require('../../src/lib/api/services/apiService').boardApiService.getBoard;
      const mockGetColumns = require('../../src/lib/api/services/apiService').boardApiService.getColumns;
      const mockGetTasks = require('../../src/lib/api/services/apiService').taskApiService.getTasks;

      mockGetBoard.mockResolvedValue({
        success: true,
        data: { id: '1', title: 'Test Board' },
      });
      mockGetColumns.mockResolvedValue({
        success: true,
        data: [{ id: '1', title: 'To Do', position: 0, board_id: '1' }],
      });
      mockGetTasks.mockResolvedValue({
        success: true,
        data: [],
      });

      // Mock subscription error
      mockChannel.subscribe.mockImplementation((callback) => {
        callback({ status: 'SUBSCRIBED' });
        // Simulate error after subscription
        setTimeout(() => {
          callback({ status: 'CHANNEL_ERROR', error: 'Connection failed' });
        }, 100);
      });

      renderWithQueryClient(<BoardView boardId="1" />);

      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalled();
      });

      // The component should still render despite subscription errors
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });
  });
});
