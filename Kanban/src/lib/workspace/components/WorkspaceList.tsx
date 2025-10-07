/**
 * Workspace List Component
 * Displays list of workspaces with API integration
 */

'use client';

import React from 'react';
import { useWorkspaces, useWorkspaceMutations } from '../../api/hooks/useApiQueries';
import { DataFetcher } from '../../ui/components/DataFetcher';
import { LoadingSpinner, ApiError } from '../../ui/components/LoadingSpinner';
import { useRouter } from 'next/navigation';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export const WorkspaceList: React.FC = () => {
  const { data: workspaces, isLoading, error, refetch } = useWorkspaces();
  const { deleteWorkspace } = useWorkspaceMutations();
  const router = useRouter();

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (confirm('Are you sure you want to delete this workspace?')) {
      try {
        await deleteWorkspace.mutateAsync(workspaceId);
      } catch (err) {
        console.error('Failed to delete workspace:', err);
      }
    }
  };

  const handleCreateWorkspace = () => {
    router.push('/workspaces/new' as any);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
        <button
          onClick={handleCreateWorkspace}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Workspace
        </button>
      </div>

      <DataFetcher
        data={workspaces}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        emptyComponent={
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No workspaces</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new workspace.
            </p>
            <div className="mt-6">
              <button
                onClick={handleCreateWorkspace}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create your first workspace
              </button>
            </div>
          </div>
        }
      >
        {(workspaces: Workspace[]) => (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onDelete={() => handleDeleteWorkspace(workspace.id)}
                onSelect={() => router.push(`/workspaces/${workspace.id}` as any)}
              />
            ))}
          </div>
        )}
      </DataFetcher>
    </div>
  );
};

interface WorkspaceCardProps {
  workspace: Workspace;
  onDelete: () => void;
  onSelect: () => void;
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ workspace, onDelete, onSelect }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {workspace.name}
            </h3>
            {workspace.description && (
              <p className="mt-1 text-sm text-gray-500 truncate">
                {workspace.description}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <div className="relative">
              <button
                type="button"
                className="bg-white rounded-full flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement dropdown menu
                }}
              >
                <span className="sr-only">Open options</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            {workspace.member_count || 0} members
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onSelect}
              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
            >
              View
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-900 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};