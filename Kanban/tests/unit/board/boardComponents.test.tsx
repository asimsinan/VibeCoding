/**
 * Unit tests for board components
 * Tests BoardView, ColumnHeader, and CreateBoard components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BoardView } from '../../../src/lib/board/components/BoardView';
import { ColumnHeader } from '../../../src/lib/board/components/ColumnHeader';
import { CreateBoard } from '../../../src/lib/board/components/CreateBoard';
import { useBoard } from '../../../src/lib/board/hooks/useBoard';

// Mock the useBoard hook
jest.mock('../../../src/lib/board/hooks/useBoard');
const mockUseBoard = useBoard as jest.MockedFunction<typeof useBoard>;

describe('BoardView Component', () => {
  const mockBoard = {
    id: 'board-123',
    title: 'Test Board',
    description: 'A test board',
    workspace_id: 'workspace-123',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    created_by: 'user-123',
  };

  const mockColumns = [
    {
      id: 'column-123',
      title: 'To Do',
      position: 0,
      board_id: 'board-123',
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'column-456',
      title: 'In Progress',
      position: 1,
      board_id: 'board-123',
      created_at: '2023-01-01T00:00:00Z',
    },
  ];

  it('should render board view', () => {
    mockUseBoard.mockReturnValue({
      board: mockBoard,
      columns: mockColumns,
      loading: false,
      error: null,
      updateBoard: jest.fn(),
      addColumn: jest.fn(),
      updateColumn: jest.fn(),
      deleteColumn: jest.fn(),
      reorderColumns: jest.fn(),
      deleteBoard: jest.fn(),
      setError: jest.fn(),
    });

    render(<BoardView boardId="board-123" />);

    expect(screen.getByText('Test Board')).toBeInTheDocument();
    expect(screen.getByText('A test board')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseBoard.mockReturnValue({
      board: null,
      columns: [],
      loading: true,
      error: null,
      updateBoard: jest.fn(),
      addColumn: jest.fn(),
      updateColumn: jest.fn(),
      deleteColumn: jest.fn(),
      reorderColumns: jest.fn(),
      deleteBoard: jest.fn(),
      setError: jest.fn(),
    });

    render(<BoardView boardId="board-123" />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUseBoard.mockReturnValue({
      board: null,
      columns: [],
      loading: false,
      error: 'Board not found',
      updateBoard: jest.fn(),
      addColumn: jest.fn(),
      updateColumn: jest.fn(),
      deleteColumn: jest.fn(),
      reorderColumns: jest.fn(),
      deleteBoard: jest.fn(),
      setError: jest.fn(),
    });

    render(<BoardView boardId="board-123" />);

    expect(screen.getByText(/board not found/i)).toBeInTheDocument();
  });

  it('should handle add column action', async () => {
    const mockAddColumn = jest.fn();
    mockUseBoard.mockReturnValue({
      board: mockBoard,
      columns: mockColumns,
      loading: false,
      error: null,
      updateBoard: jest.fn(),
      addColumn: mockAddColumn,
      updateColumn: jest.fn(),
      deleteColumn: jest.fn(),
      reorderColumns: jest.fn(),
      deleteBoard: jest.fn(),
      setError: jest.fn(),
    });

    render(<BoardView boardId="board-123" />);

    fireEvent.click(screen.getByLabelText(/add column/i));

    await waitFor(() => {
      expect(screen.getByLabelText(/column title/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/column title/i), {
      target: { value: 'New Column' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add column/i }));

    expect(mockAddColumn).toHaveBeenCalledWith('New Column', 2);
  });

  it('should handle edit board action', async () => {
    const mockUpdateBoard = jest.fn();
    mockUseBoard.mockReturnValue({
      board: mockBoard,
      columns: mockColumns,
      loading: false,
      error: null,
      updateBoard: mockUpdateBoard,
      addColumn: jest.fn(),
      updateColumn: jest.fn(),
      deleteColumn: jest.fn(),
      reorderColumns: jest.fn(),
      deleteBoard: jest.fn(),
      setError: jest.fn(),
    });

    render(<BoardView boardId="board-123" />);

    fireEvent.click(screen.getByLabelText(/edit board/i));

    await waitFor(() => {
      expect(screen.getByLabelText(/board title/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/board title/i), {
      target: { value: 'Updated Board' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(mockUpdateBoard).toHaveBeenCalledWith({
      title: 'Updated Board',
    });
  });
});

describe('ColumnHeader Component', () => {
  const mockColumn = {
    id: 'column-123',
    title: 'To Do',
    position: 0,
    board_id: 'board-123',
    created_at: '2023-01-01T00:00:00Z',
  };

  it('should render column header', () => {
    render(<ColumnHeader column={mockColumn} />);

    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  it('should handle column title edit', async () => {
    const mockOnUpdate = jest.fn();
    render(<ColumnHeader column={mockColumn} onUpdate={mockOnUpdate} />);

    fireEvent.click(screen.getByLabelText(/edit column/i));

    await waitFor(() => {
      expect(screen.getByDisplayValue('To Do')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('To Do'), {
      target: { value: 'Updated Column' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnUpdate).toHaveBeenCalledWith('column-123', {
      title: 'Updated Column',
    });
  });

  it('should handle column deletion', async () => {
    const mockOnDelete = jest.fn();
    render(<ColumnHeader column={mockColumn} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByLabelText(/delete column/i));

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    expect(mockOnDelete).toHaveBeenCalledWith('column-123');
  });

  it('should cancel column deletion', async () => {
    const mockOnDelete = jest.fn();
    render(<ColumnHeader column={mockColumn} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByLabelText(/delete column/i));

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should show task count', () => {
    render(<ColumnHeader column={mockColumn} taskCount={5} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('CreateBoard Component', () => {
  const mockOnCreate = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render create board form', () => {
    render(<CreateBoard onCreate={mockOnCreate} onCancel={mockOnCancel} workspaceId="workspace-123" />);

    expect(screen.getByLabelText(/board title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create board/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should handle form submission with valid data', async () => {
    render(<CreateBoard onCreate={mockOnCreate} onCancel={mockOnCancel} workspaceId="workspace-123" />);

    fireEvent.change(screen.getByLabelText(/board title/i), {
      target: { value: 'New Board' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'A new board' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create board/i }));

    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledWith({
        title: 'New Board',
        description: 'A new board',
        workspace_id: 'workspace-123',
      });
    });
  });

  it('should show validation errors for empty fields', async () => {
    render(<CreateBoard onCreate={mockOnCreate} onCancel={mockOnCancel} workspaceId="workspace-123" />);

    fireEvent.click(screen.getByRole('button', { name: /create board/i }));

    await waitFor(() => {
      expect(screen.getByText(/board title is required/i)).toBeInTheDocument();
    });

    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it('should show validation error for title length', async () => {
    const longTitle = 'a'.repeat(101);

    render(<CreateBoard onCreate={mockOnCreate} onCancel={mockOnCancel} workspaceId="workspace-123" />);

    fireEvent.change(screen.getByLabelText(/board title/i), {
      target: { value: longTitle },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'A new board' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create board/i }));

    await waitFor(() => {
      expect(screen.getByText(/board title must be less than 100 characters/i)).toBeInTheDocument();
    });

    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it('should show validation error for description length', async () => {
    const longDescription = 'a'.repeat(501);

    render(<CreateBoard onCreate={mockOnCreate} onCancel={mockOnCancel} workspaceId="workspace-123" />);

    fireEvent.change(screen.getByLabelText(/board title/i), {
      target: { value: 'New Board' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: longDescription },
    });

    fireEvent.click(screen.getByRole('button', { name: /create board/i }));

    await waitFor(() => {
      expect(screen.getByText(/description must be less than 500 characters/i)).toBeInTheDocument();
    });

    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it('should handle cancel action', () => {
    render(<CreateBoard onCreate={mockOnCreate} onCancel={mockOnCancel} workspaceId="workspace-123" />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should clear form when cancelled', () => {
    render(<CreateBoard onCreate={mockOnCreate} onCancel={mockOnCancel} workspaceId="workspace-123" />);

    fireEvent.change(screen.getByLabelText(/board title/i), {
      target: { value: 'New Board' },
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByLabelText(/board title/i)).toHaveValue('');
  });

  it('should show loading state during creation', () => {
    render(<CreateBoard onCreate={mockOnCreate} onCancel={mockOnCancel} workspaceId="workspace-123" loading={true} />);

    expect(screen.getByRole('button', { name: /creating board/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creating board/i })).toBeDisabled();
  });

  it('should show error message when provided', () => {
    render(<CreateBoard onCreate={mockOnCreate} onCancel={mockOnCancel} workspaceId="workspace-123" error="Creation failed" />);

    expect(screen.getByText(/creation failed/i)).toBeInTheDocument();
  });
});
