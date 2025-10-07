/**
 * Unit tests for workspace components
 * Tests WorkspaceList, WorkspaceCard, and CreateWorkspace components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkspaceList } from '../../../src/lib/workspace/components/WorkspaceList';
import { WorkspaceCard } from '../../../src/lib/workspace/components/WorkspaceCard';
import { CreateWorkspace } from '../../../src/lib/workspace/components/CreateWorkspace';
import { useWorkspace } from '../../../src/lib/workspace/hooks/useWorkspace';

// Mock the useWorkspace hook
jest.mock('../../../src/lib/workspace/hooks/useWorkspace');
const mockUseWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;

describe('WorkspaceList Component', () => {
  const mockWorkspaces = [
    {
      id: 'workspace-123',
      name: 'Test Workspace 1',
      description: 'A test workspace',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      created_by: 'user-123',
    },
    {
      id: 'workspace-456',
      name: 'Test Workspace 2',
      description: 'Another test workspace',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
      created_by: 'user-123',
    },
  ];

  it('should render workspace list', () => {
    render(<WorkspaceList workspaces={mockWorkspaces} />);

    expect(screen.getByText('Test Workspace 1')).toBeInTheDocument();
    expect(screen.getByText('Test Workspace 2')).toBeInTheDocument();
    expect(screen.getByText('A test workspace')).toBeInTheDocument();
    expect(screen.getByText('Another test workspace')).toBeInTheDocument();
  });

  it('should render empty state when no workspaces', () => {
    render(<WorkspaceList workspaces={[]} />);

    expect(screen.getByText(/no workspaces found/i)).toBeInTheDocument();
  });

  it('should handle workspace selection', () => {
    const mockOnSelect = jest.fn();
    render(<WorkspaceList workspaces={mockWorkspaces} onSelect={mockOnSelect} />);

    fireEvent.click(screen.getByText('Test Workspace 1'));

    expect(mockOnSelect).toHaveBeenCalledWith(mockWorkspaces[0]);
  });

  it('should handle workspace deletion', async () => {
    const mockOnDelete = jest.fn();
    render(<WorkspaceList workspaces={mockWorkspaces} onDelete={mockOnDelete} />);

    const deleteButtons = screen.getAllByLabelText(/delete workspace/i);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/confirm/i));

    expect(mockOnDelete).toHaveBeenCalledWith(mockWorkspaces[0].id);
  });

  it('should cancel workspace deletion', async () => {
    const mockOnDelete = jest.fn();
    render(<WorkspaceList workspaces={mockWorkspaces} onDelete={mockOnDelete} />);

    const deleteButtons = screen.getAllByLabelText(/delete workspace/i);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/cancel/i));

    expect(mockOnDelete).not.toHaveBeenCalled();
  });
});

describe('WorkspaceCard Component', () => {
  const mockWorkspace = {
    id: 'workspace-123',
    name: 'Test Workspace',
    description: 'A test workspace',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    created_by: 'user-123',
  };

  it('should render workspace card', () => {
    render(<WorkspaceCard workspace={mockWorkspace} />);

    expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    expect(screen.getByText('A test workspace')).toBeInTheDocument();
  });

  it('should handle workspace click', () => {
    const mockOnClick = jest.fn();
    render(<WorkspaceCard workspace={mockWorkspace} onClick={mockOnClick} />);

    fireEvent.click(screen.getByText('Test Workspace'));

    expect(mockOnClick).toHaveBeenCalledWith(mockWorkspace);
  });

  it('should show workspace actions when hovered', () => {
    render(<WorkspaceCard workspace={mockWorkspace} />);

    const card = screen.getByText('Test Workspace').closest('div');
    fireEvent.mouseEnter(card!);

    expect(screen.getByLabelText(/edit workspace/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/delete workspace/i)).toBeInTheDocument();
  });

  it('should handle edit action', () => {
    const mockOnEdit = jest.fn();
    render(<WorkspaceCard workspace={mockWorkspace} onEdit={mockOnEdit} />);

    const card = screen.getByText('Test Workspace').closest('div');
    fireEvent.mouseEnter(card!);

    fireEvent.click(screen.getByLabelText(/edit workspace/i));

    expect(mockOnEdit).toHaveBeenCalledWith(mockWorkspace);
  });

  it('should handle delete action', () => {
    const mockOnDelete = jest.fn();
    render(<WorkspaceCard workspace={mockWorkspace} onDelete={mockOnDelete} />);

    const card = screen.getByText('Test Workspace').closest('div');
    fireEvent.mouseEnter(card!);

    fireEvent.click(screen.getByLabelText(/delete workspace/i));

    expect(mockOnDelete).toHaveBeenCalledWith(mockWorkspace.id);
  });
});

describe('CreateWorkspace Component', () => {
  const mockOnCreate = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render create workspace form', () => {
    render(<CreateWorkspace onCreate={mockOnCreate} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/workspace name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create workspace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should handle form submission with valid data', async () => {
    render(<CreateWorkspace onCreate={mockOnCreate} onCancel={mockOnCancel} />);

    fireEvent.change(screen.getByLabelText(/workspace name/i), {
      target: { value: 'New Workspace' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'A new workspace' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create workspace/i }));

    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledWith({
        name: 'New Workspace',
        description: 'A new workspace',
      });
    });
  });

  it('should show validation errors for empty fields', async () => {
    render(<CreateWorkspace onCreate={mockOnCreate} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /create workspace/i }));

    await waitFor(() => {
      expect(screen.getByText(/workspace name is required/i)).toBeInTheDocument();
    });

    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it('should show validation error for name length', async () => {
    const longName = 'a'.repeat(101);

    render(<CreateWorkspace onCreate={mockOnCreate} onCancel={mockOnCancel} />);

    fireEvent.change(screen.getByLabelText(/workspace name/i), {
      target: { value: longName },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'A new workspace' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create workspace/i }));

    await waitFor(() => {
      expect(screen.getByText(/workspace name must be less than 100 characters/i)).toBeInTheDocument();
    });

    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it('should show validation error for description length', async () => {
    const longDescription = 'a'.repeat(501);

    render(<CreateWorkspace onCreate={mockOnCreate} onCancel={mockOnCancel} />);

    fireEvent.change(screen.getByLabelText(/workspace name/i), {
      target: { value: 'New Workspace' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: longDescription },
    });

    fireEvent.click(screen.getByRole('button', { name: /create workspace/i }));

    await waitFor(() => {
      expect(screen.getByText(/description must be less than 500 characters/i)).toBeInTheDocument();
    });

    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it('should handle cancel action', () => {
    render(<CreateWorkspace onCreate={mockOnCreate} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should clear form when cancelled', () => {
    render(<CreateWorkspace onCreate={mockOnCreate} onCancel={mockOnCancel} />);

    fireEvent.change(screen.getByLabelText(/workspace name/i), {
      target: { value: 'New Workspace' },
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByLabelText(/workspace name/i)).toHaveValue('');
  });

  it('should show loading state during creation', () => {
    render(<CreateWorkspace onCreate={mockOnCreate} onCancel={mockOnCancel} loading={true} />);

    expect(screen.getByRole('button', { name: /creating workspace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creating workspace/i })).toBeDisabled();
  });

  it('should show error message when provided', () => {
    render(<CreateWorkspace onCreate={mockOnCreate} onCancel={mockOnCancel} error="Creation failed" />);

    expect(screen.getByText(/creation failed/i)).toBeInTheDocument();
  });
});
