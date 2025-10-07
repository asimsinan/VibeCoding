/**
 * Unit tests for drag-drop components
 * Tests DragDropProvider, DroppableColumn, and DraggableTask components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DragDropProvider } from '../../../src/lib/drag-drop/components/DragDropProvider';
import { DroppableColumn } from '../../../src/lib/drag-drop/components/DroppableColumn';
import { DraggableTask } from '../../../src/lib/drag-drop/components/DraggableTask';
import { useDragDrop } from '../../../src/lib/drag-drop/hooks/useDragDrop';

// Mock the useDragDrop hook
jest.mock('../../../src/lib/drag-drop/hooks/useDragDrop');
const mockUseDragDrop = useDragDrop as jest.MockedFunction<typeof useDragDrop>;

// Mock @dnd-kit/core
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragStart, onDragOver, onDragEnd }: any) => (
    <div data-testid="dnd-context">
      {children}
      <button onClick={() => onDragStart({ active: { id: 'task-123' } })}>Start Drag</button>
      <button onClick={() => onDragOver({ active: { id: 'task-123' }, over: { id: 'column-456' } })}>Drag Over</button>
      <button onClick={() => onDragEnd({ active: { id: 'task-123' }, over: { id: 'column-456' } })}>End Drag</button>
    </div>
  ),
  DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
  useDroppable: jest.fn(() => ({
    setNodeRef: jest.fn(),
    isOver: false,
  })),
  useDraggable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  })),
  useDragOverlay: jest.fn(() => ({
    isDragging: false,
  })),
}));

// Mock @dnd-kit/sortable
jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  verticalListSortingStrategy: jest.fn(),
}));

// Mock @dnd-kit/utilities
jest.mock('@dnd-kit/utilities', () => ({
  arrayMove: jest.fn((array, oldIndex, newIndex) => {
    const newArray = [...array];
    newArray.splice(newIndex, 0, newArray.splice(oldIndex, 1)[0]);
    return newArray;
  }),
}));

describe('DragDropProvider Component', () => {
  const mockOnMove = jest.fn();
  const mockOnReorder = jest.fn();
  const mockOnReorderColumns = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDragDrop.mockReturnValue({
      activeId: null,
      overId: null,
      draggedItem: null,
      isDragging: false,
      dragOverlayData: null,
      handleDragStart: jest.fn(),
      handleDragOver: jest.fn(),
      handleDragEnd: jest.fn(),
    });
  });

  it('should render drag drop provider', () => {
    render(
      <DragDropProvider onMove={mockOnMove} onReorder={mockOnReorder} onReorderColumns={mockOnReorderColumns}>
        <div>Test Content</div>
      </DragDropProvider>
    );

    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should handle drag start event', () => {
    const mockHandleDragStart = jest.fn();
    mockUseDragDrop.mockReturnValue({
      activeId: null,
      overId: null,
      draggedItem: null,
      isDragging: false,
      dragOverlayData: null,
      handleDragStart: mockHandleDragStart,
      handleDragOver: jest.fn(),
      handleDragEnd: jest.fn(),
    });

    render(
      <DragDropProvider onMove={mockOnMove} onReorder={mockOnReorder} onReorderColumns={mockOnReorderColumns}>
        <div>Test Content</div>
      </DragDropProvider>
    );

    fireEvent.click(screen.getByText('Start Drag'));

    expect(mockHandleDragStart).toHaveBeenCalledWith({ active: { id: 'task-123' } });
  });

  it('should handle drag over event', () => {
    const mockHandleDragOver = jest.fn();
    mockUseDragDrop.mockReturnValue({
      activeId: null,
      overId: null,
      draggedItem: null,
      isDragging: false,
      dragOverlayData: null,
      handleDragStart: jest.fn(),
      handleDragOver: mockHandleDragOver,
      handleDragEnd: jest.fn(),
    });

    render(
      <DragDropProvider onMove={mockOnMove} onReorder={mockOnReorder} onReorderColumns={mockOnReorderColumns}>
        <div>Test Content</div>
      </DragDropProvider>
    );

    fireEvent.click(screen.getByText('Drag Over'));

    expect(mockHandleDragOver).toHaveBeenCalledWith({ active: { id: 'task-123' }, over: { id: 'column-456' } });
  });

  it('should handle drag end event', () => {
    const mockHandleDragEnd = jest.fn();
    mockUseDragDrop.mockReturnValue({
      activeId: null,
      overId: null,
      draggedItem: null,
      isDragging: false,
      dragOverlayData: null,
      handleDragStart: jest.fn(),
      handleDragOver: jest.fn(),
      handleDragEnd: mockHandleDragEnd,
    });

    render(
      <DragDropProvider onMove={mockOnMove} onReorder={mockOnReorder} onReorderColumns={mockOnReorderColumns}>
        <div>Test Content</div>
      </DragDropProvider>
    );

    fireEvent.click(screen.getByText('End Drag'));

    expect(mockHandleDragEnd).toHaveBeenCalledWith({ active: { id: 'task-123' }, over: { id: 'column-456' } });
  });

  it('should show drag overlay when dragging', () => {
    mockUseDragDrop.mockReturnValue({
      activeId: 'task-123',
      overId: 'column-456',
      draggedItem: { id: 'task-123', title: 'Test Task' },
      isDragging: true,
      dragOverlayData: { id: 'task-123', type: 'task', item: { id: 'task-123', title: 'Test Task' } },
      handleDragStart: jest.fn(),
      handleDragOver: jest.fn(),
      handleDragEnd: jest.fn(),
    });

    render(
      <DragDropProvider onMove={mockOnMove} onReorder={mockOnReorder} onReorderColumns={mockOnReorderColumns}>
        <div>Test Content</div>
      </DragDropProvider>
    );

    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
  });
});

describe('DroppableColumn Component', () => {
  const mockColumn = {
    id: 'column-123',
    title: 'To Do',
    position: 0,
    board_id: 'board-123',
    created_at: '2023-01-01T00:00:00Z',
  };

  const mockTasks = [
    {
      id: 'task-123',
      title: 'Test Task 1',
      description: 'A test task',
      board_id: 'board-123',
      column_id: 'column-123',
      position: 0,
      status: 'todo',
      priority: 'medium',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      created_by: 'user-123',
    },
    {
      id: 'task-456',
      title: 'Test Task 2',
      description: 'Another test task',
      board_id: 'board-123',
      column_id: 'column-123',
      position: 1,
      status: 'todo',
      priority: 'high',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      created_by: 'user-123',
    },
  ];

  it('should render droppable column', () => {
    render(<DroppableColumn column={mockColumn} tasks={mockTasks} />);

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
  });

  it('should show task count', () => {
    render(<DroppableColumn column={mockColumn} tasks={mockTasks} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should handle add task action', () => {
    const mockOnAddTask = jest.fn();
    render(<DroppableColumn column={mockColumn} tasks={mockTasks} onAddTask={mockOnAddTask} />);

    fireEvent.click(screen.getByLabelText(/add task/i));

    expect(mockOnAddTask).toHaveBeenCalledWith('column-123');
  });

  it('should handle task click', () => {
    const mockOnTaskClick = jest.fn();
    render(<DroppableColumn column={mockColumn} tasks={mockTasks} onTaskClick={mockOnTaskClick} />);

    fireEvent.click(screen.getByText('Test Task 1'));

    expect(mockOnTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('should handle task edit', () => {
    const mockOnTaskEdit = jest.fn();
    render(<DroppableColumn column={mockColumn} tasks={mockTasks} onTaskEdit={mockOnTaskEdit} />);

    const taskCard = screen.getByText('Test Task 1').closest('div');
    fireEvent.mouseEnter(taskCard!);

    fireEvent.click(screen.getByLabelText(/edit task/i));

    expect(mockOnTaskEdit).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('should handle task delete', () => {
    const mockOnTaskDelete = jest.fn();
    render(<DroppableColumn column={mockColumn} tasks={mockTasks} onTaskDelete={mockOnTaskDelete} />);

    const taskCard = screen.getByText('Test Task 1').closest('div');
    fireEvent.mouseEnter(taskCard!);

    fireEvent.click(screen.getByLabelText(/delete task/i));

    expect(mockOnTaskDelete).toHaveBeenCalledWith('task-123');
  });

  it('should show empty state when no tasks', () => {
    render(<DroppableColumn column={mockColumn} tasks={[]} />);

    expect(screen.getByText(/no tasks/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<DroppableColumn column={mockColumn} tasks={[]} loading={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

describe('DraggableTask Component', () => {
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

  it('should render draggable task', () => {
    render(<DraggableTask task={mockTask} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('A test task')).toBeInTheDocument();
  });

  it('should show priority indicator', () => {
    render(<DraggableTask task={mockTask} />);

    expect(screen.getByLabelText(/medium priority/i)).toBeInTheDocument();
  });

  it('should show due date', () => {
    render(<DraggableTask task={mockTask} />);

    expect(screen.getByText(/dec 31, 2023/i)).toBeInTheDocument();
  });

  it('should show assignee', () => {
    render(<DraggableTask task={mockTask} />);

    expect(screen.getByText(/assigned to/i)).toBeInTheDocument();
  });

  it('should handle task click', () => {
    const mockOnClick = jest.fn();
    render(<DraggableTask task={mockTask} onClick={mockOnClick} />);

    fireEvent.click(screen.getByText('Test Task'));

    expect(mockOnClick).toHaveBeenCalledWith(mockTask);
  });

  it('should show task actions when hovered', () => {
    render(<DraggableTask task={mockTask} />);

    const taskCard = screen.getByText('Test Task').closest('div');
    fireEvent.mouseEnter(taskCard!);

    expect(screen.getByLabelText(/edit task/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/delete task/i)).toBeInTheDocument();
  });

  it('should handle edit action', () => {
    const mockOnEdit = jest.fn();
    render(<DraggableTask task={mockTask} onEdit={mockOnEdit} />);

    const taskCard = screen.getByText('Test Task').closest('div');
    fireEvent.mouseEnter(taskCard!);

    fireEvent.click(screen.getByLabelText(/edit task/i));

    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it('should handle delete action', () => {
    const mockOnDelete = jest.fn();
    render(<DraggableTask task={mockTask} onDelete={mockOnDelete} />);

    const taskCard = screen.getByText('Test Task').closest('div');
    fireEvent.mouseEnter(taskCard!);

    fireEvent.click(screen.getByLabelText(/delete task/i));

    expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id);
  });

  it('should show overdue indicator for past due date', () => {
    const overdueTask = {
      ...mockTask,
      due_date: '2023-01-01T00:00:00Z',
    };

    render(<DraggableTask task={overdueTask} />);

    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it('should show dragging state when being dragged', () => {
    render(<DraggableTask task={mockTask} isDragging={true} />);

    const taskCard = screen.getByText('Test Task').closest('div');
    expect(taskCard).toHaveClass('opacity-50');
  });

  it('should show drop indicator when over target', () => {
    render(<DraggableTask task={mockTask} isOver={true} />);

    const taskCard = screen.getByText('Test Task').closest('div');
    expect(taskCard).toHaveClass('ring-2');
  });
});
