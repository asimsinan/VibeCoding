/**
 * Create workspace form component
 * Handles workspace creation with validation
 */

'use client';

import React, { useState } from 'react';
import { CreateWorkspaceData } from '../types';
import { useWorkspace } from '../hooks/useWorkspace';

interface CreateWorkspaceFormProps {
  onSuccess?: (workspace: any) => void;
  onCancel?: () => void;
  userId: string;
}

export const CreateWorkspaceForm: React.FC<CreateWorkspaceFormProps> = ({
  onSuccess,
  onCancel,
  userId,
}) => {
  const [formData, setFormData] = useState<CreateWorkspaceData>({
    name: '',
    description: '',
    created_by: userId,
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const { createWorkspace, loading, error } = useWorkspace();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validate form data
    if (!formData.name.trim()) {
      setLocalError('Workspace name is required');
      return;
    }

    if (formData.name.length > 100) {
      setLocalError('Workspace name must be less than 100 characters');
      return;
    }

    if (formData.description && formData.description.length > 500) {
      setLocalError('Description must be less than 500 characters');
      return;
    }

    try {
      const response = await createWorkspace(formData);
      
      if (response.success && response.data) {
        onSuccess?.(response.data);
        // Reset form
        setFormData({
          name: '',
          description: '',
          created_by: userId,
        });
      } else {
        setLocalError(response.error || 'Failed to create workspace');
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Workspace Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter workspace name"
          required
          maxLength={100}
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
          placeholder="Enter workspace description (optional)"
          rows={3}
          maxLength={500}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          {formData.description?.length || 0}/500 characters
        </p>
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
          {loading ? 'Creating...' : 'Create Workspace'}
        </button>
      </div>
    </form>
  );
};
