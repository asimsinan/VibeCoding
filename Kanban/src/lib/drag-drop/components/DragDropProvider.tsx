/**
 * Drag and drop provider component
 * Provides drag and drop context to child components
 */

'use client';

import React, { ReactNode } from 'react';
import { DndContextProvider } from './DndContext';
import { DragDropOptions, DragDropCallbacks } from '../types';

interface DragDropProviderProps {
  children: ReactNode;
  options?: DragDropOptions;
  callbacks?: DragDropCallbacks;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children,
  options = {},
  callbacks = {},
}) => {
  return (
    <DndContextProvider options={options} callbacks={callbacks}>
      {children}
    </DndContextProvider>
  );
};
