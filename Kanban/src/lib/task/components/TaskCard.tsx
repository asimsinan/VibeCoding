/**
 * Task Card Component
 * Individual task card in the Kanban board
 */

'use client';

import React, { useState } from 'react';
import { useTaskMutations } from '../../api/hooks/useApiQueries';
import { LoadingSpinner } from '../../ui/components/LoadingSpinner';
import { ApiError } from '../../api';

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

interface TaskCardProps {
  task: Task;
  onMove: (newPosition: number) => void;
  onEdit?: () => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onMove, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const { updateTask, deleteTask } = useTaskMutations();

  const handleEdit = () => {
    setIsEditing(true);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;

    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: {
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
        },
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask.mutateAsync(task.id);
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-2 py-1 text-sm font-medium border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            autoFocus
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full px-2 py-1 text-sm text-gray-600 border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows={2}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateTask.isPending || !editTitle.trim()}
              className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {updateTask.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="space-y-3">
        {/* Task Title */}
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</h4>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Edit task"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Delete task"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Task Description */}
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-3">{task.description}</p>
        )}

        {/* Task Metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Priority Badge */}
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}
            >
              {priorityLabels[task.priority as keyof typeof priorityLabels]}
            </span>

            {/* Due Date */}
            {task.due_date && (
              <span className="text-xs text-gray-500">
                {formatDate(task.due_date)}
              </span>
            )}
          </div>

          {/* Assignee Avatar */}
          {task.assignee_id && (
            <div className="flex-shrink-0">
              <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {task.assignee_id.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {(updateTask.error || deleteTask.error) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>Error: {(updateTask.error || deleteTask.error)?.message}</p>
            <button 
              onClick={() => {
                updateTask.reset();
                deleteTask.reset();
              }}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};