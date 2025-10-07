/**
 * Task form component
 * Handles task creation and editing with validation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Task, CreateTaskData, UpdateTaskData } from '../types';
import { useTask } from '../hooks/useTask';

interface TaskFormProps {
  onSuccess?: (task: Task) => void;
  onCancel?: () => void;
  task?: Task; // If provided, form is in edit mode
  boardId: string;
  columnId: string;
  userId: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  onSuccess,
  onCancel,
  task,
  boardId,
  columnId,
  userId,
}) => {
  const isEditMode = !!task;
  
  const [formData, setFormData] = useState<CreateTaskData | UpdateTaskData>({
    title: task?.title || '',
    description: task?.description || '',
    board_id: boardId,
    column_id: task?.column_id || columnId,
    position: task?.position || 0,
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee_id: task?.assignee_id || undefined,
    due_date: task?.due_date || undefined,
    created_by: userId,
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const { createTask, updateTask, loading, error } = useTask();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validate form data
    if (!formData.title || formData.title.trim().length === 0) {
      setLocalError('Task title is required');
      return;
    }

    if (formData.title.length > 200) {
      setLocalError('Task title must be less than 200 characters');
      return;
    }

    if (formData.description && formData.description.length > 1000) {
      setLocalError('Description must be less than 1000 characters');
      return;
    }

    if (formData.position !== undefined && formData.position < 0) {
      setLocalError('Position must be non-negative');
      return;
    }

    try {
      let response;
      
      if (isEditMode && task) {
        response = await updateTask(task.id, formData as UpdateTaskData);
      } else {
        response = await createTask(formData as CreateTaskData);
      }
      
      if (response.data) {
        onSuccess?.(response.data as Task);
        // Reset form if not in edit mode
        if (!isEditMode) {
          setFormData({
            title: '',
            description: '',
            board_id: boardId,
            column_id: columnId,
            position: 0,
            status: 'todo',
            priority: 'medium',
            assignee_id: undefined,
            due_date: undefined,
            created_by: userId,
          });
        }
      } else {
        setLocalError(response.error || `Failed to ${isEditMode ? 'update' : 'create'} task`);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Task Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter task title"
          required
          maxLength={200}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Enter task description (optional)"
          rows={3}
          maxLength={1000}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          {formData.description?.length || 0}/1000 characters
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
          Due Date
        </label>
        <input
          type="datetime-local"
          id="due_date"
          name="due_date"
          value={formData.due_date ? new Date(formData.due_date).toISOString().slice(0, 16) : ''}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="assignee_id" className="block text-sm font-medium text-gray-700">
          Assignee ID
        </label>
        <input
          type="text"
          id="assignee_id"
          name="assignee_id"
          value={formData.assignee_id || ''}
          onChange={handleInputChange}
          placeholder="Enter assignee ID (optional)"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {displayError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{displayError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Task' : 'Create Task')}
        </button>
      </div>
    </form>
  );
};
