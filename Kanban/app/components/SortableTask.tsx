import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTaskProps {
  task: any;
  onEdit: (task: any) => void;
  onDelete: (taskId: string) => void;
  style?: React.CSSProperties;
}

const SortableTask: React.FC<SortableTaskProps> = ({ task, onEdit, onDelete, style }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style_transform = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...style,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500 shadow-md';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-500 shadow-md';
      case 'low':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500 shadow-md';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-500 shadow-md';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'low':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Overdue', color: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', color: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md' };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' };
    } else {
      return { text: date.toLocaleDateString(), color: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md' };
    }
  };

  const dueDateInfo = formatDate(task.due_date);

  return (
    <div
      ref={setNodeRef}
      style={style_transform}
      {...attributes}
      className={`group relative bg-white rounded-2xl shadow-lg border border-gray-200 cursor-default sortable-item ${
        isDragging 
          ? 'opacity-50 rotate-2 scale-105 shadow-2xl z-50 transition-none' 
          : 'hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-100'
      }`}
    >
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -translate-y-10 translate-x-10 opacity-60 ${
        isDragging ? 'transition-none' : 'group-hover:opacity-80 transition-opacity duration-100'
      }`}></div>
      
      <div className="relative p-5">
        {/* Drag Handle */}
        <div 
          {...listeners}
          className="absolute top-3 left-3 w-6 h-6 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity duration-100 flex items-center justify-center"
        >
          <div className="flex flex-col space-y-0.5">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4 pl-8">
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-100 line-clamp-2 leading-tight">
              {task.title}
            </h4>
          </div>
          
          {/* Task Actions */}
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-100 shadow-md hover:shadow-lg transform hover:scale-105"
              title="Edit task"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-100 shadow-md hover:shadow-lg transform hover:scale-105"
              title="Delete task"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Metadata */}
        <div className="space-y-3">
          {/* Priority */}
          {task.priority && (
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                {getPriorityIcon(task.priority)}
                <span className="ml-1 capitalize">{task.priority}</span>
              </span>
            </div>
          )}

          {/* Due Date */}
          {dueDateInfo && (
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${dueDateInfo.color}`}>
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {dueDateInfo.text}
              </span>
            </div>
          )}

          {/* Assignee */}
          {task.assignee_id && (
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {task.assignee_name ? task.assignee_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="ml-2 text-xs text-gray-600 font-medium">
                {task.assignee_name || 'Assigned'}
              </span>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((tag: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                >
                  #{tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {new Date(task.created_at).toLocaleDateString()}
          </div>
          
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500 font-medium">Active</span>
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 pointer-events-none rounded-2xl ${
        isDragging ? 'transition-none' : 'group-hover:opacity-100 transition-opacity duration-200'
      }`}></div>
    </div>
  );
};

export default SortableTask;
