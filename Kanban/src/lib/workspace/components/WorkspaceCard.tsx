/**
 * Workspace card component
 * Displays individual workspace information
 */

'use client';

import React from 'react';
import { Workspace } from '../types';

interface WorkspaceCardProps {
  workspace: Workspace;
  onSelect?: (workspace: Workspace) => void;
  onEdit?: (workspace: Workspace) => void;
  onDelete?: (workspace: Workspace) => void;
  showActions?: boolean;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspace,
  onSelect,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const handleSelect = () => {
    onSelect?.(workspace);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(workspace);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(workspace);
  };

  return (
    <div
      className="relative group bg-white p-6 rounded-lg border border-gray-200 hover:border-gray-300 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 cursor-pointer"
      onClick={handleSelect}
    >
      <div>
        <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600">
          {workspace.name}
        </h3>
        {workspace.description && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-2">
            {workspace.description}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Created {new Date(workspace.created_at).toLocaleDateString()}
        </p>
      </div>
      
      {showActions && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleSelect}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
          >
            Open workspace
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEdit}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              title="Edit workspace"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-600 focus:outline-none"
              title="Delete workspace"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
