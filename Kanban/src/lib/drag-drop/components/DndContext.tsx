/**
 * Drag and drop context component
 * Provides drag and drop functionality using @dnd-kit
 */

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragCancelEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  rectIntersection,
} from '@dnd-kit/core';
import { DragItem, DropResult, DragDropContext, DragDropOptions, DragDropCallbacks } from '../types';
import { useDragDrop } from '../hooks/useDragDrop';

interface DndContextProviderProps {
  children: ReactNode;
  options?: DragDropOptions;
  callbacks?: DragDropCallbacks;
}

const DndContextProvider: React.FC<DndContextProviderProps> = ({
  children,
  options = {},
  callbacks = {},
}) => {
  const {
    context,
    loading,
    error,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    clearError,
  } = useDragDrop(options, callbacks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const active = event.active;
    const dragItem: DragItem = {
      id: active.id as string,
      type: active.data.current?.type || 'task',
      data: active.data.current?.data || {},
    };
    onDragStart(dragItem);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const active = event.active;
    const over = event.over;
    
    const activeItem: DragItem = {
      id: active.id as string,
      type: active.data.current?.type || 'task',
      data: active.data.current?.data || {},
    };

    const overItem: DragItem | null = over ? {
      id: over.id as string,
      type: over.data.current?.type || 'task',
      data: over.data.current?.data || {},
    } : null;

    onDragOver(activeItem, overItem);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const active = event.active;
    const over = event.over;
    
    const activeItem: DragItem = {
      id: active.id as string,
      type: active.data.current?.type || 'task',
      data: active.data.current?.data || {},
    };

    const overItem: DragItem | null = over ? {
      id: over.id as string,
      type: over.data.current?.type || 'task',
      data: over.data.current?.data || {},
    } : null;

    const result: DropResult = {
      active: activeItem,
      over: overItem,
      delta: event.delta,
      placement: 'inside', // This would need to be calculated based on the drop position
    };

    await onDragEnd(result);
  };

  const handleDragCancel = (event: DragCancelEvent) => {
    onDragCancel();
  };

  const collisionDetection = options.collisionDetection === 'closestCenter' 
    ? closestCenter 
    : rectIntersection;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay>
        {context.isDragging && context.activeId ? (
          <div className="opacity-50">
            {/* This would render the dragged item */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
              Dragging {context.activeId}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export { DndContextProvider };
