import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTask from './SortableTask';

interface DroppableColumnProps {
  column: any;
  tasks: any[];
  onEditTask: (task: any) => void;
  onDeleteTask: (taskId: string) => void;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ column, tasks, onEditTask, onDeleteTask }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${column.id}`,
  });

  const getColumnColor = (columnName: string) => {
    if (!columnName) return 'from-indigo-500 to-indigo-600';
    switch (columnName.toLowerCase()) {
      case 'to do':
      case 'todo':
        return 'from-gray-500 to-gray-600';
      case 'in progress':
      case 'inprogress':
        return 'from-blue-500 to-blue-600';
      case 'done':
      case 'completed':
        return 'from-green-500 to-green-600';
      default:
        return 'from-indigo-500 to-indigo-600';
    }
  };

  const getColumnIcon = (columnName: string) => {
    if (!columnName) {
      return (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    }
    switch (columnName.toLowerCase()) {
      case 'to do':
      case 'todo':
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'in progress':
      case 'inprogress':
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'done':
      case 'completed':
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
        );
    }
  };

  return (
    <div className="group">
      {/* Column Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-r ${getColumnColor(column.title)} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
              {getColumnIcon(column.title)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
                {column.title}
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </p>
            </div>
          </div>
          
          {/* Column Actions */}
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 bg-gradient-to-r ${getColumnColor(column.title)} transition-all duration-500 ease-out`}
            style={{ 
              width: `${tasks.length > 0 ? Math.min((tasks.length / Math.max(tasks.length, 1)) * 100, 100) : 0}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`min-h-[400px] rounded-2xl border-2 border-dashed droppable-area ${
          isOver
            ? 'border-blue-400 bg-blue-50/50 shadow-lg transition-all duration-100'
            : 'border-gray-200 bg-gray-50/30 hover:border-gray-300 hover:bg-gray-50/50 transition-all duration-100'
        }`}
      >
        {/* Drop Zone Indicator */}
        {isOver && (
          <div className="flex items-center justify-center h-32 text-blue-500">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-sm font-medium">Drop here</p>
            </div>
          </div>
        )}

        {/* Tasks */}
        <div className="p-4 space-y-4">
          <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm font-medium">No tasks yet</p>
                <p className="text-gray-400 text-xs mt-1">Drag tasks here or create new ones</p>
              </div>
            ) : (
              tasks.map((task: any, index: number) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.3s ease-out forwards'
                  }}
                />
              ))
            )}
          </SortableContext>
        </div>
      </div>
    </div>
  );
};

export default DroppableColumn;
