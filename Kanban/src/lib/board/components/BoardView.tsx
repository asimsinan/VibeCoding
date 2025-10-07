/**
 * Board View Component
 * Main Kanban board with columns and tasks
 */

'use client';

import React from 'react';
import { useBoard, useBoardColumns, useTasks, useTaskMutations } from '../../api/hooks/useApiQueries';
import { useTaskRealtime } from '../../api/hooks/useRealtime';
import { DataFetcher } from '../../ui/components/DataFetcher';
import { LoadingSpinner } from '../../ui/components/LoadingSpinner';
import { Column } from './Column';
import { CreateTaskForm } from './CreateTaskForm';

interface BoardViewProps {
  boardId: string;
}

export const BoardView: React.FC<BoardViewProps> = ({ boardId }) => {
  const { data: board, isLoading: boardLoading, error: boardError, refetch: refetchBoard } = useBoard(boardId);
  const { data: columns, isLoading: columnsLoading, error: columnsError, refetch: refetchColumns } = useBoardColumns(boardId);
  const { data: tasks, isLoading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks(boardId);
  const { moveTask } = useTaskMutations();
  
  // Enable real-time updates for this board
  useTaskRealtime(boardId);

  const isLoading = boardLoading || columnsLoading || tasksLoading;
  const error = boardError || columnsError || tasksError;

  const handleTaskMove = async (taskId: string, columnId: string, position: number) => {
    try {
      await moveTask.mutateAsync({ taskId, columnId, position });
      // Refetch tasks to ensure UI is in sync
      refetchTasks();
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  };

  const handleTaskCreate = () => {
    // Refetch tasks after creation
    refetchTasks();
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading board..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>Error: {error.message}</p>
        <button 
          onClick={() => { refetchBoard(); refetchColumns(); refetchTasks(); }}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!board || !columns || !tasks) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Board not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The requested board could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Board Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{board.data.title}</h1>
            {board.data.description && (
              <p className="mt-1 text-sm text-gray-500">{board.data.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <CreateTaskForm boardId={boardId} onTaskCreated={handleTaskCreate} />
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex h-full min-w-max">
          {columns.map((column) => {
            const columnTasks = tasks.filter(task => task.column_id === column.id);
            return (
              <Column
                key={column.id}
                column={column}
                tasks={columnTasks}
                onTaskMove={handleTaskMove}
                onTaskCreate={handleTaskCreate}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};