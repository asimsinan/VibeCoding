/**
 * Unit tests for useDragDrop hook
 * Tests drag and drop state management and @dnd-kit integration
 */

import { renderHook, act } from '@testing-library/react';
import { useDragDrop } from '../../../src/lib/drag-drop/hooks/useDragDrop';

// Mock @dnd-kit/core
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => children,
  DragOverlay: ({ children }: { children: React.ReactNode }) => children,
  useDroppable: jest.fn(),
  useDraggable: jest.fn(),
  useDragOverlay: jest.fn(),
  DragOverEvent: {},
  DragEndEvent: {},
  DragStartEvent: {},
}));

// Mock @dnd-kit/sortable
jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => children,
  useSortable: jest.fn(),
  verticalListSortingStrategy: jest.fn(),
}));

// Mock @dnd-kit/utilities
jest.mock('@dnd-kit/utilities', () => ({
  arrayMove: jest.fn(),
}));

describe('useDragDrop Hook', () => {
  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useDragDrop());

      expect(result.current.activeId).toBeNull();
      expect(result.current.overId).toBeNull();
      expect(result.current.draggedItem).toBeNull();
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('Drag Start', () => {
    it('should handle drag start event', () => {
      const { result } = renderHook(() => useDragDrop());

      const mockDragStartEvent = {
        active: {
          id: 'task-123',
          data: {
            current: {
              type: 'task',
              item: { id: 'task-123', title: 'Test Task' },
            },
          },
        },
      };

      act(() => {
        result.current.handleDragStart(mockDragStartEvent as any);
      });

      expect(result.current.activeId).toBe('task-123');
      expect(result.current.draggedItem).toEqual({ id: 'task-123', title: 'Test Task' });
      expect(result.current.isDragging).toBe(true);
    });

    it('should handle drag start with different item types', () => {
      const { result } = renderHook(() => useDragDrop());

      const mockDragStartEvent = {
        active: {
          id: 'column-123',
          data: {
            current: {
              type: 'column',
              item: { id: 'column-123', title: 'Test Column' },
            },
          },
        },
      };

      act(() => {
        result.current.handleDragStart(mockDragStartEvent as any);
      });

      expect(result.current.activeId).toBe('column-123');
      expect(result.current.draggedItem).toEqual({ id: 'column-123', title: 'Test Column' });
      expect(result.current.isDragging).toBe(true);
    });
  });

  describe('Drag Over', () => {
    it('should handle drag over event', () => {
      const { result } = renderHook(() => useDragDrop());

      const mockDragOverEvent = {
        active: {
          id: 'task-123',
          data: {
            current: {
              type: 'task',
              item: { id: 'task-123', title: 'Test Task' },
            },
          },
        },
        over: {
          id: 'column-456',
          data: {
            current: {
              type: 'column',
              item: { id: 'column-456', title: 'Target Column' },
            },
          },
        },
      };

      act(() => {
        result.current.handleDragOver(mockDragOverEvent as any);
      });

      expect(result.current.overId).toBe('column-456');
    });

    it('should handle drag over with no over target', () => {
      const { result } = renderHook(() => useDragDrop());

      const mockDragOverEvent = {
        active: {
          id: 'task-123',
          data: {
            current: {
              type: 'task',
              item: { id: 'task-123', title: 'Test Task' },
            },
          },
        },
        over: null,
      };

      act(() => {
        result.current.handleDragOver(mockDragOverEvent as any);
      });

      expect(result.current.overId).toBeNull();
    });
  });

  describe('Drag End', () => {
    it('should handle successful drag end', () => {
      const mockOnMove = jest.fn();
      const { result } = renderHook(() => useDragDrop({ onMove: mockOnMove }));

      // Set up initial state
      act(() => {
        result.current.handleDragStart({
          active: {
            id: 'task-123',
            data: {
              current: {
                type: 'task',
                item: { id: 'task-123', title: 'Test Task', column_id: 'column-123' },
              },
            },
          },
        } as any);
      });

      const mockDragEndEvent = {
        active: {
          id: 'task-123',
          data: {
            current: {
              type: 'task',
              item: { id: 'task-123', title: 'Test Task', column_id: 'column-123' },
            },
          },
        },
        over: {
          id: 'column-456',
          data: {
            current: {
              type: 'column',
              item: { id: 'column-456', title: 'Target Column' },
            },
          },
        },
      };

      act(() => {
        result.current.handleDragEnd(mockDragEndEvent as any);
      });

      expect(mockOnMove).toHaveBeenCalledWith('task-123', 'column-456', 0);
      expect(result.current.activeId).toBeNull();
      expect(result.current.overId).toBeNull();
      expect(result.current.draggedItem).toBeNull();
      expect(result.current.isDragging).toBe(false);
    });

    it('should handle drag end with no over target', () => {
      const mockOnMove = jest.fn();
      const { result } = renderHook(() => useDragDrop({ onMove: mockOnMove }));

      // Set up initial state
      act(() => {
        result.current.handleDragStart({
          active: {
            id: 'task-123',
            data: {
              current: {
                type: 'task',
                item: { id: 'task-123', title: 'Test Task' },
              },
            },
          },
        } as any);
      });

      const mockDragEndEvent = {
        active: {
          id: 'task-123',
          data: {
            current: {
              type: 'task',
              item: { id: 'task-123', title: 'Test Task' },
            },
          },
        },
        over: null,
      };

      act(() => {
        result.current.handleDragEnd(mockDragEndEvent as any);
      });

      expect(mockOnMove).not.toHaveBeenCalled();
      expect(result.current.activeId).toBeNull();
      expect(result.current.overId).toBeNull();
      expect(result.current.draggedItem).toBeNull();
      expect(result.current.isDragging).toBe(false);
    });

    it('should handle drag end with same source and destination', () => {
      const mockOnMove = jest.fn();
      const { result } = renderHook(() => useDragDrop({ onMove: mockOnMove }));

      // Set up initial state
      act(() => {
        result.current.handleDragStart({
          active: {
            id: 'task-123',
            data: {
              current: {
                type: 'task',
                item: { id: 'task-123', title: 'Test Task', column_id: 'column-123' },
              },
            },
          },
        } as any);
      });

      const mockDragEndEvent = {
        active: {
          id: 'task-123',
          data: {
            current: {
              type: 'task',
              item: { id: 'task-123', title: 'Test Task', column_id: 'column-123' },
            },
          },
        },
        over: {
          id: 'column-123',
          data: {
            current: {
              type: 'column',
              item: { id: 'column-123', title: 'Same Column' },
            },
          },
        },
      };

      act(() => {
        result.current.handleDragEnd(mockDragEndEvent as any);
      });

      expect(mockOnMove).not.toHaveBeenCalled();
      expect(result.current.activeId).toBeNull();
      expect(result.current.overId).toBeNull();
      expect(result.current.draggedItem).toBeNull();
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('Task Reordering', () => {
    it('should handle task reordering within same column', () => {
      const mockOnReorder = jest.fn();
      const { result } = renderHook(() => useDragDrop({ onReorder: mockOnReorder }));

      const mockDragEndEvent = {
        active: {
          id: 'task-123',
          data: {
            current: {
              type: 'task',
              item: { id: 'task-123', title: 'Test Task', column_id: 'column-123', position: 0 },
            },
          },
        },
        over: {
          id: 'task-456',
          data: {
            current: {
              type: 'task',
              item: { id: 'task-456', title: 'Another Task', column_id: 'column-123', position: 1 },
            },
          },
        },
      };

      act(() => {
        result.current.handleDragEnd(mockDragEndEvent as any);
      });

      expect(mockOnReorder).toHaveBeenCalledWith('column-123', ['task-456', 'task-123']);
    });

    it('should handle task reordering with new position', () => {
      const mockOnReorder = jest.fn();
      const { result } = renderHook(() => useDragDrop({ onReorder: mockOnReorder }));

      const mockDragEndEvent = {
        active: {
          id: 'task-123',
          data: {
            current: {
              type: 'task',
              item: { id: 'task-123', title: 'Test Task', column_id: 'column-123', position: 0 },
            },
          },
        },
        over: {
          id: 'task-789',
          data: {
            current: {
              type: 'task',
              item: { id: 'task-789', title: 'Third Task', column_id: 'column-123', position: 2 },
            },
          },
        },
      };

      act(() => {
        result.current.handleDragEnd(mockDragEndEvent as any);
      });

      expect(mockOnReorder).toHaveBeenCalledWith('column-123', ['task-456', 'task-789', 'task-123']);
    });
  });

  describe('Column Reordering', () => {
    it('should handle column reordering', () => {
      const mockOnReorderColumns = jest.fn();
      const { result } = renderHook(() => useDragDrop({ onReorderColumns: mockOnReorderColumns }));

      const mockDragEndEvent = {
        active: {
          id: 'column-123',
          data: {
            current: {
              type: 'column',
              item: { id: 'column-123', title: 'To Do', position: 0 },
            },
          },
        },
        over: {
          id: 'column-456',
          data: {
            current: {
              type: 'column',
              item: { id: 'column-456', title: 'In Progress', position: 1 },
            },
          },
        },
      };

      act(() => {
        result.current.handleDragEnd(mockDragEndEvent as any);
      });

      expect(mockOnReorderColumns).toHaveBeenCalledWith(['column-456', 'column-123']);
    });
  });

  describe('Error Handling', () => {
    it('should handle drag end with invalid item types', () => {
      const mockOnMove = jest.fn();
      const { result } = renderHook(() => useDragDrop({ onMove: mockOnMove }));

      const mockDragEndEvent = {
        active: {
          id: 'task-123',
          data: {
            current: {
              type: 'invalid-type',
              item: { id: 'task-123', title: 'Test Task' },
            },
          },
        },
        over: {
          id: 'column-456',
          data: {
            current: {
              type: 'column',
              item: { id: 'column-456', title: 'Target Column' },
            },
          },
        },
      };

      act(() => {
        result.current.handleDragEnd(mockDragEndEvent as any);
      });

      expect(mockOnMove).not.toHaveBeenCalled();
      expect(result.current.activeId).toBeNull();
      expect(result.current.overId).toBeNull();
      expect(result.current.draggedItem).toBeNull();
      expect(result.current.isDragging).toBe(false);
    });

    it('should handle drag end with missing data', () => {
      const mockOnMove = jest.fn();
      const { result } = renderHook(() => useDragDrop({ onMove: mockOnMove }));

      const mockDragEndEvent = {
        active: {
          id: 'task-123',
          data: null,
        },
        over: {
          id: 'column-456',
          data: {
            current: {
              type: 'column',
              item: { id: 'column-456', title: 'Target Column' },
            },
          },
        },
      };

      act(() => {
        result.current.handleDragEnd(mockDragEndEvent as any);
      });

      expect(mockOnMove).not.toHaveBeenCalled();
      expect(result.current.activeId).toBeNull();
      expect(result.current.overId).toBeNull();
      expect(result.current.draggedItem).toBeNull();
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('Drag Overlay', () => {
    it('should provide drag overlay data', () => {
      const { result } = renderHook(() => useDragDrop());

      // Set up initial state
      act(() => {
        result.current.handleDragStart({
          active: {
            id: 'task-123',
            data: {
              current: {
                type: 'task',
                item: { id: 'task-123', title: 'Test Task' },
              },
            },
          },
        } as any);
      });

      expect(result.current.dragOverlayData).toEqual({
        id: 'task-123',
        type: 'task',
        item: { id: 'task-123', title: 'Test Task' },
      });
    });

    it('should clear drag overlay data on drag end', () => {
      const { result } = renderHook(() => useDragDrop());

      // Set up initial state
      act(() => {
        result.current.handleDragStart({
          active: {
            id: 'task-123',
            data: {
              current: {
                type: 'task',
                item: { id: 'task-123', title: 'Test Task' },
              },
            },
          },
        } as any);
      });

      expect(result.current.dragOverlayData).not.toBeNull();

      act(() => {
        result.current.handleDragEnd({
          active: { id: 'task-123' },
          over: null,
        } as any);
      });

      expect(result.current.dragOverlayData).toBeNull();
    });
  });
});
