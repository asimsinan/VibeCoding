/**
 * Unit tests for task components
 * Tests TaskCard, TaskForm, and TaskDetails components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskCard } from '../../../src/lib/task/components/TaskCard';
import { TaskForm } from '../../../src/lib/task/components/TaskForm';
import { TaskDetails } from '../../../src/lib/task/components/TaskDetails';
import { useTask } from '../../../src/lib/task/hooks/useTask';

// Mock the useTask hook
jest.mock('../../../src/lib/task/hooks/useTask');
const mockUseTask = useTask as jest.MockedFunction<typeof useTask>;

describe('TaskCard Component', () => {
  const mockTask = {
    id: 'task-123',
    title: 'Test Task',
    description: 'A test task',
    board_id: 'board-123',
    column_id: 'column-123',
    position: 0,
    status: 'todo',
    priority: 'medium',
    assignee_id: 'user-123',
    due_date: '2023-12-31T23:59:59Z',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    created_by: 'user-123',
  };

  it('should render task card', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('A test task')).toBeInTheDocument();
  });

  it('should show priority indicator', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByLabelText(/medium priority/i)).toBeInTheDocument();
  });

  it('should show due date', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByText(/dec 31, 2023/i)).toBeInTheDocument();
  });

  it('should show assignee', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByText(/assigned to/i)).toBeInTheDocument();
  });

  it('should handle task click', () => {
    const mockOnClick = jest.fn();
    render(<TaskCard task={mockTask} onClick={mockOnClick} />);

    fireEvent.click(screen.getByText('Test Task'));

    expect(mockOnClick).toHaveBeenCalledWith(mockTask);
  });

  it('should show task actions when hovered', () => {
    render(<TaskCard task={mockTask} />);

    const card = screen.getByText('Test Task').closest('div');
    fireEvent.mouseEnter(card!);

    expect(screen.getByLabelText(/edit task/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/delete task/i)).toBeInTheDocument();
  });

  it('should handle edit action', () => {
    const mockOnEdit = jest.fn();
    render(<TaskCard task={mockTask} onEdit={mockOnEdit} />);

    const card = screen.getByText('Test Task').closest('div');
    fireEvent.mouseEnter(card!);

    fireEvent.click(screen.getByLabelText(/edit task/i));

    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it('should handle delete action', () => {
    const mockOnDelete = jest.fn();
    render(<TaskCard task={mockTask} onDelete={mockOnDelete} />);

    const card = screen.getByText('Test Task').closest('div');
    fireEvent.mouseEnter(card!);

    fireEvent.click(screen.getByLabelText(/delete task/i));

    expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id);
  });

  it('should show overdue indicator for past due date', () => {
    const overdueTask = {
      ...mockTask,
      due_date: '2023-01-01T00:00:00Z',
    };

    render(<TaskCard task={overdueTask} />);

    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });
});

describe('TaskForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render create task form', () => {
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} boardId="board-123" columnId="column-123" />);

    expect(screen.getByLabelText(/task title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should render edit task form', () => {
    const mockTask = {
      id: 'task-123',
      title: 'Test Task',
      description: 'A test task',
      board_id: 'board-123',
      column_id: 'column-123',
      position: 0,
      status: 'todo',
      priority: 'medium',
      assignee_id: 'user-123',
      due_date: '2023-12-31T23:59:59Z',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      created_by: 'user-123',
    };

    render(<TaskForm task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A test task')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update task/i })).toBeInTheDocument();
  });

  it('should handle form submission with valid data', async () => {
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} boardId="board-123" columnId="column-123" />);

    fireEvent.change(screen.getByLabelText(/task title/i), {
      target: { value: 'New Task' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'A new task' },
    });
    fireEvent.change(screen.getByLabelText(/priority/i), {
      target: { value: 'high' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'A new task',
        board_id: 'board-123',
        column_id: 'column-123',
        position: 0,
        status: 'todo',
        priority: 'high',
        assignee_id: null,
        due_date: null,
      });
    });
  });

  it('should show validation errors for empty fields', async () => {
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} boardId="board-123" columnId="column-123" />);

    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByText(/task title is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error for title length', async () => {
    const longTitle = 'a'.repeat(201);

    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} boardId="board-123" columnId="column-123" />);

    fireEvent.change(screen.getByLabelText(/task title/i), {
      target: { value: longTitle },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'A new task' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByText(/task title must be less than 200 characters/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should handle cancel action', () => {
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} boardId="board-123" columnId="column-123" />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show loading state during submission', () => {
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} boardId="board-123" columnId="column-123" loading={true} />);

    expect(screen.getByRole('button', { name: /creating task/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creating task/i })).toBeDisabled();
  });

  it('should show error message when provided', () => {
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} boardId="board-123" columnId="column-123" error="Creation failed" />);

    expect(screen.getByText(/creation failed/i)).toBeInTheDocument();
  });
});

describe('TaskDetails Component', () => {
  const mockTask = {
    id: 'task-123',
    title: 'Test Task',
    description: 'A test task',
    board_id: 'board-123',
    column_id: 'column-123',
    position: 0,
    status: 'todo',
    priority: 'medium',
    assignee_id: 'user-123',
    due_date: '2023-12-31T23:59:59Z',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    created_by: 'user-123',
  };

  it('should render task details', () => {
    render(<TaskDetails task={mockTask} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('A test task')).toBeInTheDocument();
    expect(screen.getByText(/medium priority/i)).toBeInTheDocument();
    expect(screen.getByText(/dec 31, 2023/i)).toBeInTheDocument();
  });

  it('should handle task update', async () => {
    const mockOnUpdate = jest.fn();
    render(<TaskDetails task={mockTask} onUpdate={mockOnUpdate} />);

    fireEvent.click(screen.getByLabelText(/edit task/i));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('Test Task'), {
      target: { value: 'Updated Task' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(mockOnUpdate).toHaveBeenCalledWith('task-123', {
      title: 'Updated Task',
    });
  });

  it('should handle task deletion', async () => {
    const mockOnDelete = jest.fn();
    render(<TaskDetails task={mockTask} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByLabelText(/delete task/i));

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    expect(mockOnDelete).toHaveBeenCalledWith('task-123');
  });

  it('should cancel task deletion', async () => {
    const mockOnDelete = jest.fn();
    render(<TaskDetails task={mockTask} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByLabelText(/delete task/i));

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should handle task assignment', async () => {
    const mockOnAssign = jest.fn();
    render(<TaskDetails task={mockTask} onAssign={mockOnAssign} />);

    fireEvent.click(screen.getByLabelText(/assign task/i));

    await waitFor(() => {
      expect(screen.getByLabelText(/assign to/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/assign to/i), {
      target: { value: 'user-456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /assign/i }));

    expect(mockOnAssign).toHaveBeenCalledWith('task-123', 'user-456');
  });

  it('should handle task unassignment', async () => {
    const mockOnUnassign = jest.fn();
    render(<TaskDetails task={mockTask} onUnassign={mockOnUnassign} />);

    fireEvent.click(screen.getByLabelText(/unassign task/i));

    expect(mockOnUnassign).toHaveBeenCalledWith('task-123');
  });

  it('should show task comments', () => {
    const mockComments = [
      {
        id: 'comment-123',
        content: 'This is a comment',
        created_at: '2023-01-01T00:00:00Z',
        created_by: 'user-123',
      },
    ];

    render(<TaskDetails task={mockTask} comments={mockComments} />);

    expect(screen.getByText('This is a comment')).toBeInTheDocument();
  });

  it('should handle adding new comment', async () => {
    const mockOnAddComment = jest.fn();
    render(<TaskDetails task={mockTask} onAddComment={mockOnAddComment} />);

    fireEvent.change(screen.getByLabelText(/add comment/i), {
      target: { value: 'New comment' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add comment/i }));

    expect(mockOnAddComment).toHaveBeenCalledWith('task-123', 'New comment');
  });
});
