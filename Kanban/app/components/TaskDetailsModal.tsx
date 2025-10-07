import React, { useState, useEffect } from 'react';

interface TaskDetailsModalProps {
  task: any;
  users: any[];
  onUpdate: (updatedTask: any) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  users,
  onUpdate,
  onDelete,
  onClose
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  const handleSave = async () => {
    setUpdating(true);
    try {
      // Convert due_date to ISO string if it exists
      const taskToUpdate = {
        ...editedTask,
        due_date: editedTask.due_date ? new Date(editedTask.due_date).toISOString() : null
      };
      
      await onUpdate(taskToUpdate);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(task.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setDeleting(false);
    }
  };

  const getPriorityColors = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500 shadow-lg';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-500 shadow-lg';
      case 'low':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500 shadow-lg';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-500 shadow-lg';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />;
      case 'medium':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />;
      case 'low':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />;
      default:
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />;
    }
  };

  const getDueDateStatus = (dueDate: string) => {
    if (!dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Overdue', color: 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500 shadow-lg' };
    } else if (diffDays === 0) {
      return { text: 'Due Today', color: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 shadow-lg' };
    } else if (diffDays === 1) {
      return { text: 'Due Tomorrow', color: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-500 shadow-lg' };
    } else {
      return { text: `Due ${new Date(dueDate).toLocaleDateString()}`, color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg' };
    }
  };

  const dueDateStatus = getDueDateStatus(task.due_date);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-backdrop-fade-in">
      {/* Enhanced Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse-slow"></div>
      </div>

      <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-4xl transform transition-all duration-500 scale-100 animate-modal-slide-in">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-20 translate-x-20 opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full translate-y-16 -translate-x-16 opacity-40"></div>
        
        <div className="relative p-10">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-8 " style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl animate-pulse-slow group">
                <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent animate-shimmer">
                  Task Details
                </h3>
                <p className="text-gray-600 text-base font-medium">
                  View and manage task information
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-3 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-all duration-200 group"
              >
                <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Task Title */}
            <div className="space-y-3">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Task Title
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                  className="block w-full px-6 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-xl font-bold placeholder-gray-400"
                  placeholder="Enter task title..."
                />
              ) : (
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl text-xl font-bold text-gray-900 border border-gray-200">
                  {task.title}
                </div>
              )}
            </div>

            {/* Task Description */}
            <div className="space-y-3">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={editedTask.description || ''}
                  onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                  className="block w-full px-6 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-base font-medium resize-none placeholder-gray-400"
                  rows={4}
                  placeholder="Enter task description..."
                />
              ) : (
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl text-base font-medium text-gray-900 min-h-[6rem] border border-gray-200">
                  {task.description || 'No description provided'}
                </div>
              )}
            </div>

            {/* Task Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Priority */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Priority
                </label>
                {isEditing ? (
                  <select
                    value={editedTask.priority || ''}
                    onChange={(e) => setEditedTask({...editedTask, priority: e.target.value})}
                    className="block w-full px-6 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-base font-medium appearance-none cursor-pointer"
                  >
                    <option value="">Select Priority</option>
                    <option value="low" className="text-green-600">🟢 Low Priority</option>
                    <option value="medium" className="text-yellow-600">🟡 Medium Priority</option>
                    <option value="high" className="text-orange-600">🟠 High Priority</option>
                  </select>
                ) : (
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                    {task.priority ? (
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getPriorityColors(task.priority)}`}>
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {getPriorityIcon(task.priority)}
                        </svg>
                        <span className="capitalize">{task.priority}</span>
                      </span>
                    ) : (
                      <span className="text-gray-500 font-medium">No priority set</span>
                    )}
                  </div>
                )}
              </div>

              {/* Assignee */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Assignee
                </label>
                {isEditing ? (
                  <select
                    value={editedTask.assignee_id || ''}
                    onChange={(e) => setEditedTask({...editedTask, assignee_id: e.target.value})}
                    className="block w-full px-6 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-base font-medium appearance-none cursor-pointer"
                  >
                    <option value="">Select Assignee</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id} className="text-gray-700">
                        👤 {user.name || user.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                    {task.assignee_name ? (
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md mr-3">
                          {task.assignee_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-900 font-medium">{task.assignee_name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 font-medium">No assignee</span>
                    )}
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Due Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedTask.due_date || ''}
                    onChange={(e) => setEditedTask({...editedTask, due_date: e.target.value})}
                    className="block w-full px-6 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-base font-medium"
                  />
                ) : (
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                    {task.due_date ? (
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${dueDateStatus?.color || 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {dueDateStatus?.text || `Due ${new Date(task.due_date).toLocaleDateString()}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500 font-medium">No due date set</span>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <svg className="w-4 h-4 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Tags
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTask.tags ? editedTask.tags.join(', ') : ''}
                    onChange={(e) => setEditedTask({...editedTask, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)})}
                    className="block w-full px-6 py-4 border-2 border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-base font-medium"
                    placeholder="Enter tags separated by commas..."
                  />
                ) : (
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                    {task.tags && task.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag: string, index: number) => (
                          <span key={index} className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-pink-500 to-rose-500 text-white border border-pink-500 shadow-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 font-medium">No tags</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTask(task);
                  }}
                  className="px-8 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-200 border-2 border-transparent hover:border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updating || !editedTask.title.trim()}
                  className="group px-8 py-3 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                >
                  {updating ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span>Save Changes</span>
                      <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-60 flex items-center justify-center p-4">
          <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-md transform transition-all duration-500 scale-100">
            <div className="p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Task</h3>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-8">
                Are you sure you want to delete <strong>"{task.title}"</strong>? This will permanently remove the task and all its data.
              </p>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {deleting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </div>
                  ) : (
                    'Delete Task'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailsModal;
