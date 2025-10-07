/**
 * Real-time Hooks
 * React hooks for managing Supabase Realtime subscriptions
 */

import { useEffect, useRef } from 'react';
import { realtimeService } from '../realtime/realtimeService';

// Hook for workspace real-time updates
export function useWorkspaceRealtime(userId: string | undefined) {
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!userId || isSubscribed.current) return;

    realtimeService.subscribeToWorkspaces(userId);
    isSubscribed.current = true;

    return () => {
      realtimeService.unsubscribe(`workspaces-${userId}`);
      isSubscribed.current = false;
    };
  }, [userId]);
}

// Hook for board real-time updates
export function useBoardRealtime(workspaceId: string | undefined) {
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!workspaceId || isSubscribed.current) return;

    realtimeService.subscribeToBoards(workspaceId);
    isSubscribed.current = true;

    return () => {
      realtimeService.unsubscribe(`boards-${workspaceId}`);
      isSubscribed.current = false;
    };
  }, [workspaceId]);
}

// Hook for task real-time updates
export function useTaskRealtime(boardId: string | undefined) {
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!boardId || isSubscribed.current) return;

    realtimeService.subscribeToTasks(boardId);
    realtimeService.subscribeToColumns(boardId);
    isSubscribed.current = true;

    return () => {
      realtimeService.unsubscribe(`tasks-${boardId}`);
      realtimeService.unsubscribe(`columns-${boardId}`);
      isSubscribed.current = false;
    };
  }, [boardId]);
}

// Hook for managing multiple real-time subscriptions
export function useRealtimeSubscriptions(subscriptions: {
  workspaces?: string;
  boards?: string;
  tasks?: string;
}) {
  useEffect(() => {
    if (subscriptions.workspaces) {
      realtimeService.subscribeToWorkspaces(subscriptions.workspaces);
    }
    if (subscriptions.boards) {
      realtimeService.subscribeToBoards(subscriptions.boards);
    }
    if (subscriptions.tasks) {
      realtimeService.subscribeToTasks(subscriptions.tasks);
      realtimeService.subscribeToColumns(subscriptions.tasks);
    }

    return () => {
      if (subscriptions.workspaces) {
        realtimeService.unsubscribe(`workspaces-${subscriptions.workspaces}`);
      }
      if (subscriptions.boards) {
        realtimeService.unsubscribe(`boards-${subscriptions.boards}`);
      }
      if (subscriptions.tasks) {
        realtimeService.unsubscribe(`tasks-${subscriptions.tasks}`);
        realtimeService.unsubscribe(`columns-${subscriptions.tasks}`);
      }
    };
  }, [subscriptions.workspaces, subscriptions.boards, subscriptions.tasks]);
}
