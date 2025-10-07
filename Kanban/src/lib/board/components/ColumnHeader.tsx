/**
 * Column header component
 * Displays column title and actions
 */

'use client';

import React from 'react';
import { Column } from '../types';

interface ColumnHeaderProps {
  column: Column;
  onEdit?: (column: Column) => void;
  onDelete?: (column: Column) => void;
  showActions?: boolean;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  column,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(column);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(column);
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-gray-900">{column.title}</h3>
      
      {showActions && (
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEdit}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            title="Edit column"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-600 focus:outline-none"
            title="Delete column"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
