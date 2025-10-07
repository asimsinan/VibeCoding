/**
 * Create Task Form Component
 * Form for creating new tasks
 */

'use client';

import React, { useState } from 'react';
import { useTaskMutations } from '../../api/hooks/useApiQueries';
import { LoadingSpinner } from '../../ui/components/LoadingSpinner';

interface CreateTaskFormProps {
  boardId: string;
  columnId?: string;
  onTaskCreated: () => void;
  onCancel?: () => void;
}

export const CreateTaskForm: React.FC<CreateTaskFormProps> = ({
  boardId,
  columnId,
  onTaskCreated,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const { createTask } = useTaskMutations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        board_id: boardId,
        column_id: columnId || '', // Will be set by the column
        position: 0, // Will be calculated by the backend
        status: 'todo',
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        due_date: dueDate || undefined,
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      
      onTaskCreated();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="sr-only">Task title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="description" className="sr-only">Description</label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="priority" className="sr-only">Priority</label>
            <select
              id="priority"
              name="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="dueDate" className="sr-only">Due date</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        {createTask.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>Error: {createTask.error?.message}</p>
            <button 
              onClick={() => createTask.reset()}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={createTask.isPending || !title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {createTask.isPending ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Creating...</span>
              </div>
            ) : (
              'Create Task'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
