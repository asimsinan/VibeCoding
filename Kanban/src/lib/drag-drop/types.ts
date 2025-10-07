/**
 * Drag and drop types
 * TypeScript types for drag and drop functionality
 */

export interface DragItem {
  id: string;
  type: 'task' | 'column';
  data: any;
}

export interface DropResult {
  active: DragItem;
  over: DragItem | null;
  delta: {
    x: number;
    y: number;
  };
  placement: 'before' | 'after' | 'inside';
}

export interface DragDropContext {
  activeId: string | null;
  overId: string | null;
  delta: {
    x: number;
    y: number;
  };
  isDragging: boolean;
  isOver: boolean;
}

export interface DragDropOptions {
  collisionDetection?: 'rectIntersection' | 'closestCenter' | 'closestCorners';
  measuring?: {
    droppable: {
      strategy: 'whileDragging' | 'always';
    };
  };
  modifiers?: any[];
  sensors?: any[];
}

export interface DragDropCallbacks {
  onDragStart?: (active: DragItem) => void;
  onDragOver?: (active: DragItem, over: DragItem | null) => void;
  onDragEnd?: (result: DropResult) => void;
  onDragCancel?: () => void;
}
