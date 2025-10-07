/**
 * Column Component
 * Individual column in the Kanban board
 */

'use client';

import React, { useState } from 'react';
import { TaskCard } from '../../task/components/TaskCard';
import { CreateTaskForm } from './CreateTaskForm';

interface Column {
  id: string;
  title: string;
  position: number;
  board_id: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee_id?: string;
  due_date?: string;
  position: number;
  column_id: string;
  created_at: string;
  updated_at: string;
}

interface ColumnProps {
  column: Column;
  tasks: Task[];
  onTaskMove: (taskId: string, columnId: string, position: number) => void;
  onTaskCreate: () => void;
}

export const Column: React.FC<ColumnProps> = ({ column, tasks, onTaskMove, onTaskCreate }) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleTaskMove = (taskId: string, newPosition: number) => {
    onTaskMove(taskId, column.id, newPosition);
  };

  const handleTaskCreate = () => {
    setIsCreating(false);
    onTaskCreate();
  };

  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);

  return (
    <div className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4 mx-2">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{column.title}</h3>
        <div className="flex items-center space-x-2">
          <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
            {tasks.length}
          </span>
          <button
            onClick={() => setIsCreating(true)}
            className="text-gray-400 hover:text-gray-600"
            title="Add task"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3 min-h-[200px]">
        {isCreating && (
          <div className="mb-4">
            <CreateTaskForm
              boardId={column.board_id}
              columnId={column.id}
              onTaskCreated={handleTaskCreate}
              onCancel={() => setIsCreating(false)}
            />
          </div>
        )}

        {sortedTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onMove={(newPosition) => handleTaskMove(task.id, newPosition)}
          />
        ))}

        {tasks.length === 0 && !isCreating && (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm">No tasks yet</p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-2 text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              Add your first task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
