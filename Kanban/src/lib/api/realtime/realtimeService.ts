/**
 * Real-time Service
 * Handles Supabase Realtime subscriptions for live updates
 */

import { createClient } from '@supabase/supabase-js';
import { queryClient, queryKeys } from '../queryClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class RealtimeService {
  private subscriptions: Map<string, any> = new Map();

  // Subscribe to workspace changes
  subscribeToWorkspaces(userId: string) {
    const subscriptionKey = `workspaces-${userId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      return; // Already subscribed
    }

    const subscription = supabase
      .channel('workspaces')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspaces',
          filter: `created_by=eq.${userId}`,
        },
        (payload) => {
          console.log('Workspace change received:', payload);
          this.handleWorkspaceChange(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
  }

  // Subscribe to board changes
  subscribeToBoards(workspaceId: string) {
    const subscriptionKey = `boards-${workspaceId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      return; // Already subscribed
    }

    const subscription = supabase
      .channel('boards')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boards',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('Board change received:', payload);
          this.handleBoardChange(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
  }

  // Subscribe to task changes
  subscribeToTasks(boardId: string) {
    const subscriptionKey = `tasks-${boardId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      return; // Already subscribed
    }

    const subscription = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          console.log('Task change received:', payload);
          this.handleTaskChange(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
  }

  // Subscribe to column changes
  subscribeToColumns(boardId: string) {
    const subscriptionKey = `columns-${boardId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      return; // Already subscribed
    }

    const subscription = supabase
      .channel('columns')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'columns',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          console.log('Column change received:', payload);
          this.handleColumnChange(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
  }

  // Handle workspace changes
  private handleWorkspaceChange(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        // Add new workspace to cache
        queryClient.setQueryData(queryKeys.workspaces.list(), (oldData: any) => {
          if (!oldData) return [newRecord];
          return [...oldData, newRecord];
        });
        break;

      case 'UPDATE':
        // Update workspace in cache
        queryClient.setQueryData(queryKeys.workspaces.list(), (oldData: any) => {
          if (!oldData) return [newRecord];
          return oldData.map((workspace: any) =>
            workspace.id === newRecord.id ? newRecord : workspace
          );
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(newRecord.id) });
        break;

      case 'DELETE':
        // Remove workspace from cache
        queryClient.setQueryData(queryKeys.workspaces.list(), (oldData: any) => {
          if (!oldData) return [];
          return oldData.filter((workspace: any) => workspace.id !== oldRecord.id);
        });
        queryClient.removeQueries({ queryKey: queryKeys.workspaces.detail(oldRecord.id) });
        break;
    }
  }

  // Handle board changes
  private handleBoardChange(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        // Add new board to cache
        queryClient.setQueryData(queryKeys.boards.list(newRecord.workspace_id), (oldData: any) => {
          if (!oldData) return [newRecord];
          return [...oldData, newRecord];
        });
        break;

      case 'UPDATE':
        // Update board in cache
        queryClient.setQueryData(queryKeys.boards.list(newRecord.workspace_id), (oldData: any) => {
          if (!oldData) return [newRecord];
          return oldData.map((board: any) =>
            board.id === newRecord.id ? newRecord : board
          );
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(newRecord.id) });
        break;

      case 'DELETE':
        // Remove board from cache
        queryClient.setQueryData(queryKeys.boards.list(oldRecord.workspace_id), (oldData: any) => {
          if (!oldData) return [];
          return oldData.filter((board: any) => board.id !== oldRecord.id);
        });
        queryClient.removeQueries({ queryKey: queryKeys.boards.detail(oldRecord.id) });
        break;
    }
  }

  // Handle task changes
  private handleTaskChange(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        // Add new task to cache
        queryClient.setQueryData(queryKeys.tasks.list(newRecord.board_id), (oldData: any) => {
          if (!oldData) return [newRecord];
          return [...oldData, newRecord];
        });
        break;

      case 'UPDATE':
        // Update task in cache
        queryClient.setQueryData(queryKeys.tasks.list(newRecord.board_id), (oldData: any) => {
          if (!oldData) return [newRecord];
          return oldData.map((task: any) =>
            task.id === newRecord.id ? newRecord : task
          );
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(newRecord.id) });
        break;

      case 'DELETE':
        // Remove task from cache
        queryClient.setQueryData(queryKeys.tasks.list(oldRecord.board_id), (oldData: any) => {
          if (!oldData) return [];
          return oldData.filter((task: any) => task.id !== oldRecord.id);
        });
        queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(oldRecord.id) });
        break;
    }
  }

  // Handle column changes
  private handleColumnChange(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        // Add new column to cache
        queryClient.setQueryData(queryKeys.boards.columns(newRecord.board_id), (oldData: any) => {
          if (!oldData) return [newRecord];
          return [...oldData, newRecord];
        });
        break;

      case 'UPDATE':
        // Update column in cache
        queryClient.setQueryData(queryKeys.boards.columns(newRecord.board_id), (oldData: any) => {
          if (!oldData) return [newRecord];
          return oldData.map((column: any) =>
            column.id === newRecord.id ? newRecord : column
          );
        });
        break;

      case 'DELETE':
        // Remove column from cache
        queryClient.setQueryData(queryKeys.boards.columns(oldRecord.board_id), (oldData: any) => {
          if (!oldData) return [];
          return oldData.filter((column: any) => column.id !== oldRecord.id);
        });
        break;
    }
  }

  // Unsubscribe from specific subscription
  unsubscribe(subscriptionKey: string) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll() {
    this.subscriptions.forEach((subscription, key) => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
  }

  // Get active subscriptions
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }
}

// Create singleton instance
export const realtimeService = new RealtimeService();
