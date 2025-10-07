'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';

import TaskDetailsModal from './components/TaskDetailsModal';
import NotificationToast from '../components/NotificationToast';
import DroppableColumn from './components/DroppableColumn';
import InvitationNotification from '../components/InvitationNotification';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [workspaceCreated, setWorkspaceCreated] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [boards, setBoards] = useState<any[]>([]);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [boardCreated, setBoardCreated] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<any>(null);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [editingBoard, setEditingBoard] = useState<any>(null);
  const [showEditBoardModal, setShowEditBoardModal] = useState(false);
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [editBoardDescription, setEditBoardDescription] = useState('');
  const [updatingBoard, setUpdatingBoard] = useState(false);
  const [columns, setColumns] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskTags, setTaskTags] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Enhanced functionality state
  const [activeTask, setActiveTask] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [taskFilters, setTaskFilters] = useState({
    priority: '',
    assignee: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDeleteWorkspaceConfirm, setShowDeleteWorkspaceConfirm] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Board deletion states
  const [showDeleteBoardModal, setShowDeleteBoardModal] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<any>(null);
  
  // Notification types and interface
  type NotificationType = 'success' | 'error' | 'info' | 'warning';
  
  interface Notification {
    id: string;
    message: string;
    type: NotificationType;
  }
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated by looking for session data
    const checkAuth = async () => {
      try {
        // Try to get user info from localStorage or check session
        const token = localStorage.getItem('supabase.auth.token');
        if (token) {
          setIsAuthenticated(true);
          // Get current user ID from token
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUserId(payload.sub);
          } catch (error) {
            console.error('Error parsing token:', error);
          }
          // Load workspaces for authenticated user
          await loadWorkspaces();
        }
      } catch (error) {
        console.log('No authentication found');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedBoard) {
      loadUsers();
    }
  }, [selectedBoard]);


  // Real-time updates with polling (disabled during drag operations)
  useEffect(() => {
    if (!selectedBoard || isDragging) return;

    const pollInterval = setInterval(() => {
      loadTasks(selectedBoard.id);
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [selectedBoard, isDragging]);

  const loadWorkspaces = async () => {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch('/api/v1/workspaces', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  };

  const loadBoards = async (workspaceId: string) => {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/boards`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBoards(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load boards:', error);
    }
  };

  const loadTasks = async (boardId: string) => {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`/api/v1/boards/${boardId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.data.tasks || []);
        setColumns(data.data.columns || []);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedBoard) return;

    setCreatingTask(true);
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`/api/v1/boards/${selectedBoard.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          priority: taskPriority || 'medium',
          assignee_id: taskAssignee || null,
          due_date: taskDueDate ? new Date(taskDueDate).toISOString() : null,
          tags: taskTags ? taskTags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prev => [...prev, data.data]);
        setShowCreateTaskModal(false);
        setTaskTitle('');
        setTaskDescription('');
        setTaskPriority('');
        setTaskAssignee('');
        setTaskDueDate('');
        setTaskTags('');
        addNotification('🎉 Task created successfully! Your new task is ready to go.', 'success');
      } else {
        const errorData = await response.json();
        addNotification('❌ Failed to create task. Please check your input and try again.', 'error');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      addNotification('🌐 Network error. Please check your connection and try again.', 'error');
    } finally {
      setCreatingTask(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(task => task.id === active.id);
    setActiveTask(task);
    setIsDragging(true); // Disable polling during drag
    
    // Add visual feedback immediately
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setIsDragging(false); // Re-enable polling after drag

    if (!over || !selectedBoard) return;

    const taskId = active.id;
    const overId = String(over.id);
    
    // Find the task being dragged
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let newColumnId: string;
    let isCrossColumnMove = false;

    // Check if dropping on a column (cross-column move)
    if (overId.startsWith('column-')) {
      newColumnId = overId.replace('column-', '');
      isCrossColumnMove = true;
    } else {
      // Dropping on another task - find which column that task belongs to
      const targetTask = tasks.find(t => t.id === overId);
      if (!targetTask) return;
      newColumnId = targetTask.column_id;
      isCrossColumnMove = task.column_id !== newColumnId;
    }

    // Validate that the newColumnId is a valid column
    const isValidColumn = columns.some(c => c.id === newColumnId);
    if (!isValidColumn) {
      return;
    }

    // If it's not a cross-column move and we're in the same column, handle reordering
    if (!isCrossColumnMove) {
      // For within-column reordering, calculate the new position
      const columnTasks = tasks.filter(t => t.column_id === newColumnId).sort((a, b) => a.position - b.position);
      const targetTaskIndex = columnTasks.findIndex(t => t.id === overId);
      const newPosition = targetTaskIndex >= 0 ? targetTaskIndex : columnTasks.length;
      
      
      // Update positions immediately for better responsiveness
      setTasks(prev => {
        const updated = [...prev];
        const draggedTask = updated.find(t => t.id === taskId);
        if (!draggedTask) return prev;
        
        // Remove the dragged task from its current position
        const otherTasks = updated.filter(t => t.id !== taskId && t.column_id === newColumnId);
        
        // Insert the dragged task at the new position
        otherTasks.splice(newPosition, 0, { ...draggedTask, position: newPosition });
        
        // Update positions for all tasks in the column
        otherTasks.forEach((task, index) => {
          const taskIndex = updated.findIndex(t => t.id === task.id);
          if (taskIndex !== -1) {
            updated[taskIndex] = { ...updated[taskIndex], position: index };
          }
        });
        
        return updated;
      });
      
      // Make API call in background
      (async () => {
        try {
          const token = localStorage.getItem('supabase.auth.token');
          
          if (!token) {
            addNotification('🔐 Authentication required. Please log in again to continue.', 'warning');
            return;
          }
          
          const response = await fetch(`/api/v1/tasks/${taskId}/move`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              column_id: newColumnId,
              position: newPosition
            }),
          });

          if (!response.ok) {
            // Revert on error
            setTasks(prev => prev.map(t => 
              t.id === taskId ? { ...t, position: task.position } : t
            ));
          }
        } catch (error) {
          // Revert on error
          setTasks(prev => prev.map(t => 
            t.id === taskId ? { ...t, position: task.position } : t
          ));
        }
      })();
      
      return;
    }

    // Calculate position for cross-column moves
    const targetColumnTasks = tasks.filter(t => t.column_id === newColumnId).sort((a, b) => a.position - b.position);
    const targetTaskIndex = targetColumnTasks.findIndex(t => t.id === overId);
    const newPosition = targetTaskIndex >= 0 ? targetTaskIndex : targetColumnTasks.length;


    // Optimistically update the UI for cross-column moves
    setTasks(prev => {
      const updated = [...prev];
      const draggedTask = updated.find(t => t.id === taskId);
      if (!draggedTask) return prev;
      
      // Remove the dragged task from its current position
      const otherTasks = updated.filter(t => t.id !== taskId && t.column_id === newColumnId);
      
      // Insert the dragged task at the new position
      otherTasks.splice(newPosition, 0, { ...draggedTask, column_id: newColumnId, position: newPosition });
      
      // Update positions for all tasks in the target column
      otherTasks.forEach((task, index) => {
        const taskIndex = updated.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
          updated[taskIndex] = { ...updated[taskIndex], position: index };
        }
      });
      
      // Update the dragged task
      const draggedTaskIndex = updated.findIndex(t => t.id === taskId);
      if (draggedTaskIndex !== -1) {
        updated[draggedTaskIndex] = { ...updated[draggedTaskIndex], column_id: newColumnId, position: newPosition };
      }
      
      return updated;
    });

    try {
      const token = localStorage.getItem('supabase.auth.token');
      
      if (!token) {
        addNotification('Authentication required. Please log in again.', 'error');
        return;
      }
      
      const response = await fetch(`/api/v1/tasks/${taskId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          column_id: newColumnId,
          position: newPosition
        }),
      });

      if (!response.ok) {
        // Revert on error
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, column_id: task.column_id } : t
        ));
        addNotification('Failed to move task', 'error');
      }
    } catch (error) {
      // Revert on error
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, column_id: task.column_id } : t
      ));
    }
  };

  // Task editing functions
  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowTaskDetailsModal(true);
  };

  const handleUpdateTask = async (updatedTask: any) => {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`/api/v1/tasks/${updatedTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedTask),
      });

      if (response.ok) {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        setEditingTask(null);
        setShowTaskDetailsModal(false);
        addNotification('✨ Task updated successfully! Your changes have been saved.', 'success');
      } else {
        addNotification('❌ Failed to update task. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Update task error:', error);
      addNotification('🌐 Network error. Please check your connection and try again.', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`/api/v1/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setEditingTask(null);
        setShowTaskDetailsModal(false);
        addNotification('🗑️ Task deleted successfully! The task has been removed.', 'success');
      } else {
        console.error('Failed to delete task');
        addNotification('❌ Failed to delete task. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Delete task error:', error);
      addNotification('🌐 Network error. Please check your connection and try again.', 'error');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!selectedWorkspace) return;
    
    setDeletingWorkspace(true);
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`/api/v1/workspaces/${selectedWorkspace.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        setWorkspaces(prev => prev.filter(w => w.id !== selectedWorkspace.id));
        setSelectedWorkspace(null);
        setBoards([]);
        setTasks([]);
        setShowWorkspaceSettings(false);
        setShowDeleteWorkspaceConfirm(false);
        addNotification('🗑️ Workspace deleted successfully! All data has been removed.', 'success');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete workspace:', errorData);
        addNotification('❌ Failed to delete workspace. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Delete workspace error:', error);
      addNotification('🌐 Network error. Please check your connection and try again.', 'error');
    } finally {
      setDeletingWorkspace(false);
    }
  };

  const handleDeleteWorkspaceFromCard = async () => {
    if (!workspaceToDelete) return;
    
    setDeletingWorkspace(true);
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`/api/v1/workspaces/${workspaceToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        setWorkspaces(prev => prev.filter(w => w.id !== workspaceToDelete.id));
        // If the deleted workspace was selected, clear selection
        if (selectedWorkspace && selectedWorkspace.id === workspaceToDelete.id) {
          setSelectedWorkspace(null);
          setBoards([]);
          setTasks([]);
        }
        setShowDeleteModal(false);
        setWorkspaceToDelete(null);
        addNotification('🗑️ Workspace deleted successfully! All data has been removed.', 'success');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete workspace:', errorData);
        addNotification('❌ Failed to delete workspace. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Delete workspace error:', error);
      addNotification('🌐 Network error. Please check your connection and try again.', 'error');
    } finally {
      setDeletingWorkspace(false);
    }
  };

  // Filter functions
  const filteredTasks = useCallback(() => {
    return tasks.filter(task => {
      if (taskFilters.priority && task.priority !== taskFilters.priority) return false;
      if (taskFilters.assignee && task.assignee_id !== taskFilters.assignee) return false;
      if (taskFilters.search && !task.title.toLowerCase().includes(taskFilters.search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => (a.position || 0) - (b.position || 0)); // Sort by position
  }, [tasks, taskFilters]);

  // Load users for assignment
  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch('/api/v1/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Load users error:', error);
    }
  };

  // Workspace management
  // Notification functions
  const addNotification = (message: string, type: NotificationType) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedWorkspace) return;

    setInviting(true);
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`/api/v1/workspaces/${selectedWorkspace.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        setInviteEmail('');
        addNotification(`📧 Invitation sent to ${data.member.email}! They'll receive a notification to join your workspace.`, 'success');
      } else {
        const errorData = await response.json();
        if (response.status === 400 && errorData.error?.includes('already a member')) {
            addNotification('👥 This user is already a member of the workspace', 'warning');
        } else {
          addNotification(errorData.error || 'Failed to send invitation', 'error');
        }
      }
    } catch (error) {
      console.error('Invite user error:', error);
      addNotification('Failed to send invitation', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleEditBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBoardTitle.trim() || !editingBoard) return;

    setUpdatingBoard(true);
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`/api/v1/boards/${editingBoard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editBoardTitle.trim(),
          description: editBoardDescription.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBoards(prev => prev.map(board => 
          board.id === editingBoard.id ? { ...board, ...data.data } : board
        ));
        setShowEditBoardModal(false);
        setEditBoardTitle('');
        setEditBoardDescription('');
        setEditingBoard(null);
        
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'success',
          message: `Board "${editBoardTitle}" updated successfully!`,
        }]);
      } else {
        const errorData = await response.json();
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'error',
          message: errorData.error?.message || 'Failed to update board',
        }]);
      }
    } catch (error) {
      console.error('Failed to update board:', error);
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        type: 'error',
        message: 'Network error. Please try again.',
      }]);
    } finally {
      setUpdatingBoard(false);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    // Find the board to delete
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    
    // Set the board to delete and show modal
    setBoardToDelete(board);
    setShowDeleteBoardModal(true);
  };

  const confirmDeleteBoard = async () => {
    if (!boardToDelete) return;
    
    setDeletingBoard(true);
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`/api/v1/boards/${boardToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setBoards(prev => prev.filter(board => board.id !== boardToDelete.id));
        setShowBoardSettings(false);
        
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'success',
          message: 'Board deleted successfully!',
        }]);
      } else {
        const errorData = await response.json();
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'error',
          message: errorData.error?.message || 'Failed to delete board',
        }]);
      }
    } catch (error) {
      console.error('Failed to delete board:', error);
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        type: 'error',
        message: 'Network error. Please try again.',
      }]);
    } finally {
      setDeletingBoard(false);
      setShowDeleteBoardModal(false);
      setBoardToDelete(null);
    }
  };

  const openEditBoard = (board: any) => {
    setEditingBoard(board);
    setEditBoardTitle(board.title);
    setEditBoardDescription(board.description || '');
    setShowEditBoardModal(true);
    setShowBoardSettings(false);
  };

  const openBoardSettings = (board: any) => {
    setEditingBoard(board);
    setShowBoardSettings(true);
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardTitle.trim() || !selectedWorkspace) return;

    setCreatingBoard(true);
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch(`/api/v1/workspaces/${selectedWorkspace.id}/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: boardTitle.trim(),
          description: boardDescription.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBoards(prev => [...prev, data.data]);
        setShowCreateBoardModal(false);
        setBoardTitle('');
        setBoardDescription('');
        
        // Show success animation
        setBoardCreated(true);
        setTimeout(() => setBoardCreated(false), 3000);
        
        // Show success notification
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'success',
          message: `Board "${boardTitle}" created successfully!`,
        }]);
      } else {
        const errorData = await response.json();
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'error',
          message: errorData.error?.message || 'Failed to create board',
        }]);
      }
    } catch (error) {
      console.error('Failed to create board:', error);
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        type: 'error',
        message: 'Network error. Please try again.',
      }]);
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    setCreating(true);
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch('/api/v1/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: workspaceName.trim(),
          description: workspaceDescription.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWorkspaces(prev => [...prev, data.data]);
        setShowCreateModal(false);
        setWorkspaceName('');
        setWorkspaceDescription('');
        
        // Show success animation
        setWorkspaceCreated(true);
        setTimeout(() => setWorkspaceCreated(false), 3000);
        
        // Show success notification
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'success',
          message: `Workspace "${workspaceName}" created successfully!`,
        }]);
      } else {
        const errorData = await response.json();
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'error',
          message: errorData.error?.message || 'Failed to create workspace',
        }]);
      }
    } catch (error) {
      console.error('Failed to create workspace:', error);
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        type: 'error',
        message: 'Network error. Please try again.',
      }]);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('supabase.auth.token');
    setIsAuthenticated(false);
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Enhanced Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse-slow"></div>
          <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-float" style={{ animationDelay: '4s' }}></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-float" style={{ animationDelay: '6s' }}></div>
        </div>

        {/* Enhanced Navigation */}
        <nav className="bg-white/90 backdrop-blur-xl border-b border-white/20 shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20">
              <div className="flex items-center space-x-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse-slow group">
                  <svg className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-shimmer">
                    Kanban Board
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">Organize your work, boost productivity</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Invitation Notifications */}
                <div className="relative">
                  <InvitationNotification onInvitationAccepted={loadWorkspaces} />
                </div>
                
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                {/* Desktop logout */}
                <button
                  onClick={handleLogout}
                  className="hidden md:block group relative px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Mobile menu */}
            {mobileMenuOpen && (
              <div className="md:hidden border-t border-gray-200 py-4 ">
                <button
                  onClick={handleLogout}
                  className="group w-full flex items-center space-x-3 px-4 py-3 text-base font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 border border-gray-200 hover:border-indigo-300"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </nav>
        
        <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 relative z-10">
          <div className="px-4 py-8 sm:px-0">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-shimmer">
                  Your Workspaces
                </h2>
                <p className="text-lg text-gray-600 mt-3 font-medium">
                  Organize your projects and collaborate with your team
                </p>
                <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{workspaces.length} Workspaces</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <span>Active Projects</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="group relative inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 "
                style={{ animationDelay: '0.4s' }}
              >
                <div className="w-6 h-6 mr-3 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span>Create Workspace</span>
                
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              </button>
            </div>
            
            {workspaces.length === 0 ? (
              <div className="relative " style={{ animationDelay: '0.6s' }}>
                {/* Enhanced Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
                </div>
                
                <div className="relative bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-200 hover:border-indigo-300 transition-all duration-300 h-96 flex items-center justify-center p-8 shadow-2xl">
                  <div className="text-center max-w-md">
                    {/* Enhanced Icon */}
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mb-8 shadow-xl animate-pulse-slow group">
                      <svg className="w-12 h-12 text-indigo-600 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    
                    {/* Enhanced Content */}
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-indigo-600 bg-clip-text text-transparent mb-4 animate-shimmer">
                      No workspaces yet
                    </h3>
                    <p className="text-lg text-gray-600 mb-10 leading-relaxed font-medium">
                      Create your first workspace to start organizing your projects and collaborating with your team.
                    </p>
                    
                    {/* Enhanced CTA Button */}
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="group relative inline-flex items-center px-10 py-5 border border-transparent text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                    >
                      <div className="w-6 h-6 mr-3 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <span>Create Your First Workspace</span>
                      
                      {/* Background decoration */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                    </button>
                  </div>
                </div>
              </div>
            ) : !selectedWorkspace ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 " style={{ animationDelay: '0.8s' }}>
                {workspaces.map((workspace: any) => (
                  <div 
                    key={workspace.id} 
                    className="group relative bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/30 hover:border-indigo-300 transform hover:-translate-y-3 hover:scale-105"
                  >
                    {/* Enhanced Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-16 translate-x-16 opacity-50 group-hover:opacity-70 transition-opacity duration-300 animate-float"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full translate-y-12 -translate-x-12 opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-float" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300 animate-pulse-slow"></div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setWorkspaceToDelete(workspace);
                        setShowDeleteModal(true);
                      }}
                      className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 transform hover:scale-110"
                      title="Delete workspace"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    
                    <div 
                      className="relative p-8 cursor-pointer"
                      onClick={() => {
                        setSelectedWorkspace(workspace);
                        loadBoards(workspace.id);
                      }}
                    >
                      {/* Enhanced Workspace icon */}
                      <div className="mb-8">
                        <div className="w-18 h-18 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300 animate-pulse-slow">
                          <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      </div>

                      {/* Enhanced Workspace info */}
                      <div className="mb-8">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-indigo-600 bg-clip-text text-transparent mb-4 group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300 animate-shimmer">
                          {workspace.name}
                        </h3>
                        <p className="text-gray-600 text-base leading-relaxed line-clamp-2 font-medium">
                          {workspace.description || 'No description provided'}
                        </p>
                      </div>

                      {/* Enhanced Metadata */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{new Date(workspace.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <span className="font-medium">Owner</span>
                        </div>
                      </div>

                      {/* Enhanced Action indicator */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-indigo-600 font-semibold text-base group-hover:text-indigo-700 transition-colors duration-300">
                          <span>View Boards</span>
                          <svg className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                          <span className="text-sm text-gray-500 font-medium">Active</span>
                        </div>
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                  </div>
                ))}
              </div>
            ) : selectedBoard ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <button
                      onClick={() => setSelectedBoard(null)}
                      className="text-indigo-600 hover:text-indigo-800 mb-2"
                    >
                      ← Back to Boards
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedBoard.title}
                    </h2>
                    <p className="text-gray-600">{selectedBoard.description}</p>
                  </div>
                  <button
                    onClick={() => setShowCreateTaskModal(true)}
                    className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <span className="font-semibold text-base">Add Task</span>
                    </div>
                    
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                  </button>
                </div>
                
                {/* Enhanced Filters Section */}
                <div className="mb-8">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    {/* Filter Toggle Button */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="group relative bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-180 transition-transform duration-300">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </div>
                        <span className="font-semibold text-base">
                          {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </span>
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                      </div>
                      
                      {/* Background decoration */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                    </button>

                    {/* Workspace Settings Button - Only for workspace owners */}
                    {selectedWorkspace && currentUserId && selectedWorkspace.created_by === currentUserId && (
                      <button
                        onClick={() => setShowWorkspaceSettings(true)}
                        className="group relative bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-base">Workspace Settings</span>
                        </div>
                      </button>
                    )}
                  </div>
                  
                  {/* Enhanced Filter Panel */}
                  {showFilters && (
                    <div className="mt-6 transform transition-all duration-500 ease-out">
                      <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                        {/* Filter Header */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">Filter Tasks</h3>
                              <p className="text-indigo-100 text-sm font-medium">Refine your task view with advanced filters</p>
                            </div>
                          </div>
                        </div>

                        {/* Filter Form */}
                        <div className="p-8">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Search Filter */}
                            <div className="space-y-3">
                              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                                <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Search Tasks
                              </label>
                              <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                                <input
                                  type="text"
                                  value={taskFilters.search}
                                  onChange={(e) => setTaskFilters({...taskFilters, search: e.target.value})}
                                  className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/70 backdrop-blur-sm text-base font-medium"
                                  placeholder="Search by title or description..."
                                />
                              </div>
                            </div>

                            {/* Priority Filter */}
                            <div className="space-y-3">
                              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                                <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                Priority Level
                              </label>
                              <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                </div>
                                <select
                                  value={taskFilters.priority}
                                  onChange={(e) => setTaskFilters({...taskFilters, priority: e.target.value})}
                                  className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white/70 backdrop-blur-sm text-base font-medium appearance-none cursor-pointer"
                                >
                                  <option value="">All Priorities</option>
                                  <option value="low" className="text-green-600">🟢 Low Priority</option>
                                  <option value="medium" className="text-yellow-600">🟡 Medium Priority</option>
                                  <option value="high" className="text-orange-600">🟠 High Priority</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* Assignee Filter */}
                            <div className="space-y-3">
                              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Assignee
                              </label>
                              <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <select
                                  value={taskFilters.assignee}
                                  onChange={(e) => setTaskFilters({...taskFilters, assignee: e.target.value})}
                                  className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/70 backdrop-blur-sm text-base font-medium appearance-none cursor-pointer"
                                >
                                  <option value="">All Assignees</option>
                                  {users.map(user => (
                                    <option key={user.id} value={user.id} className="text-gray-700">
                                      👤 {user.name || user.email}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Filter Actions */}
                          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span className="font-medium">
                                  {filteredTasks().length} of {tasks.length} tasks
                                </span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => setTaskFilters({ priority: '', assignee: '', search: '' })}
                              className="px-6 py-3 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-200 border-2 border-transparent hover:border-gray-200"
                            >
                              Clear Filters
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Kanban Board */}
                <DndContext
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 will-change-transform">
                    {columns.map((column: any) => {
                      const columnTasks = filteredTasks().filter((task: any) => task.column_id === column.id);
                      const DroppableColumnAny = DroppableColumn as any;
                      return (
                        <DroppableColumnAny
                          key={column.id}
                          column={column}
                          tasks={columnTasks}
                          onEditTask={handleEditTask}
                          onDeleteTask={handleDeleteTask}
                        />
                      );
                    })}
                  </div>
                  
                  <DragOverlay>
                    {activeTask ? (
                      <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-blue-300 opacity-95 transform rotate-2 scale-110 transition-none max-w-sm drag-overlay">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full -translate-y-8 translate-x-8 opacity-60"></div>
                        
                        <div className="relative">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                                {activeTask.title}
                              </h4>
                            </div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                          </div>

                          {/* Description */}
                          {activeTask.description && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                              {activeTask.description}
                            </p>
                          )}

                          {/* Priority */}
                          {activeTask.priority && (
                            <div className="flex items-center mb-3">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
                                activeTask.priority === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
                                activeTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                'bg-green-100 text-green-800 border border-green-200'
                              }`}>
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="capitalize">{activeTask.priority}</span>
                              </span>
                            </div>
                          )}

                          {/* Due Date */}
                          {activeTask.due_date && (
                            <div className="flex items-center mb-3">
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(activeTask.due_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          {/* Assignee */}
                          {activeTask.assignee_id && (
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {activeTask.assignee_name ? activeTask.assignee_name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span className="ml-3 text-sm text-gray-600 font-medium">
                                {activeTask.assignee_name || 'Assigned'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>
            ) : selectedWorkspace ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setSelectedWorkspace(null)}
                      className="group flex items-center text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="font-medium">Back to Workspaces</span>
                    </button>
                    <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                          {selectedWorkspace.name}
                        </h2>
                        <p className="text-gray-600 text-sm font-medium">
                          {boards.length} {boards.length === 1 ? 'board' : 'boards'} available
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateBoardModal(true)}
                    className="group relative inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Board
                  </button>
                </div>
                
                {boards.length === 0 ? (
                  <div className="relative">
                    {/* Background decoration */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
                      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
                    </div>
                    
                    <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-3xl border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors duration-300 h-96 flex items-center justify-center p-8">
                      <div className="text-center max-w-md">
                        {/* Icon */}
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                          <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                          </svg>
                        </div>
                        
                        {/* Content */}
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          No boards yet
                        </h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                          Create your first Kanban board to start organizing tasks and tracking progress.
                        </p>
                        
                        {/* CTA Button */}
                        <button
                          onClick={() => setShowCreateBoardModal(true)}
                          className="group relative inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-2xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Create Your First Board
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {boards.map((board: any, index: number) => (
                      <div 
                        key={board.id} 
                        className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2 hover:scale-105"
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animation: 'fadeInUp 0.6s ease-out forwards'
                        }}
                      >
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -translate-y-16 translate-x-16 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-pink-50 rounded-full translate-y-12 -translate-x-12 opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                        
                        {/* Card content */}
                        <div className="relative p-8">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                                </svg>
                              </div>
                            </div>
                            
                            {/* Status indicator */}
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-xs font-medium text-gray-500">Active</span>
                            </div>
                          </div>
                          
                          {/* Title */}
                          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                            {board.title}
                          </h3>
                          
                          {/* Description */}
                          <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3 min-h-[4.5rem]">
                            {board.description || 'No description provided for this board.'}
                          </p>
                          
                          {/* Metadata */}
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Created {new Date(board.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Default columns: To Do, In Progress, Done
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex space-x-3">
                            <button 
                              onClick={() => {
                                setSelectedBoard(board);
                                loadTasks(board.id);
                              }}
                              className="group/btn flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                              <div className="flex items-center justify-center">
                                <span>Open Board</span>
                                <svg className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </div>
                            </button>
                            
                            <button 
                              onClick={() => openBoardSettings(board)}
                              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 group/settings"
                            >
                              <svg className="w-5 h-5 group-hover/settings:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-gray-500 text-lg">
                  Please select a workspace to view boards
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Enhanced Create Task Modal */}
        {showCreateTaskModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-backdrop-fade-in">
            {/* Enhanced Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse-slow"></div>
            </div>

            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-2xl transform transition-all duration-500 scale-100 animate-modal-slide-in">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-20 translate-x-20 opacity-60"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full translate-y-16 -translate-x-16 opacity-40"></div>
              
              <div className="relative p-10">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between mb-8 " style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl animate-pulse-slow group">
                      <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent animate-shimmer">
                        Create New Task
                      </h3>
                      <p className="text-gray-600 text-base font-medium">
                        Add a new task to your board
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowCreateTaskModal(false)}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-all duration-300 group hover:scale-110"
                  >
                    <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Enhanced Form */}
                <form onSubmit={handleCreateTask} className="space-y-8">
                  {/* Task Title */}
                  <div className="space-y-3 " style={{ animationDelay: '0.4s' }}>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Task Title *
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/70 backdrop-blur-sm text-lg font-medium"
                        placeholder="Enter a descriptive task title..."
                        required
                      />
                    </div>
                  </div>

                  {/* Task Description */}
                  <div className="space-y-3 " style={{ animationDelay: '0.6s' }}>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Description
                    </label>
                    <div className="relative group">
                      <div className="absolute top-4 left-4 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <textarea
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm text-base font-medium resize-none"
                        placeholder="Describe the task in detail (optional)..."
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Priority and Assignee Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 " style={{ animationDelay: '0.8s' }}>
                    {/* Priority */}
                    <div className="space-y-3">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                        <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Priority Level
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <select
                          value={taskPriority}
                          onChange={(e) => setTaskPriority(e.target.value)}
                          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white/70 backdrop-blur-sm text-base font-medium appearance-none cursor-pointer"
                        >
                          <option value="">Select Priority</option>
                          <option value="low" className="text-green-600">🟢 Low Priority</option>
                          <option value="medium" className="text-yellow-600">🟡 Medium Priority</option>
                          <option value="high" className="text-orange-600">🟠 High Priority</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Assignee */}
                    <div className="space-y-3">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                        <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Assignee
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <select
                          value={taskAssignee}
                          onChange={(e) => setTaskAssignee(e.target.value)}
                          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/70 backdrop-blur-sm text-base font-medium appearance-none cursor-pointer"
                        >
                          <option value="">Select Assignee</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id} className="text-gray-700">
                              👤 {user.name || user.email}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Due Date and Tags Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 " style={{ animationDelay: '1.0s' }}>
                    {/* Due Date */}
                    <div className="space-y-3">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Due Date
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          type="date"
                          value={taskDueDate}
                          onChange={(e) => setTaskDueDate(e.target.value)}
                          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/70 backdrop-blur-sm text-base font-medium"
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-3">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                        <svg className="w-4 h-4 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Tags
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400 group-focus-within:text-pink-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={taskTags}
                          onChange={(e) => setTaskTags(e.target.value)}
                          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300 bg-white/70 backdrop-blur-sm text-base font-medium"
                          placeholder="Enter tags separated by commas..."
                        />
                      </div>
                      <p className="text-xs text-gray-500">Separate multiple tags with commas (e.g., frontend, bug, urgent)</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 " style={{ animationDelay: '1.2s' }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateTaskModal(false)}
                      className="px-8 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-200 border-2 border-transparent hover:border-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingTask || !taskTitle.trim()}
                      className="group px-8 py-3 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                    >
                      {creatingTask ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Task...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span>Create Task</span>
                          <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Create Board Modal */}
        {showCreateBoardModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            </div>

            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-lg transform transition-all duration-500 scale-100">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full -translate-y-20 translate-x-20 opacity-60"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full translate-y-16 -translate-x-16 opacity-40"></div>
              
              <div className="relative p-10">
                {/* Header */}
                <div className="text-center mb-10">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl group">
                    <svg className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
                    Create New Board
                  </h3>
                  <p className="text-gray-600 text-base">
                    Organize your tasks with a new Kanban board
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleCreateBoard} className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Board Title *
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={boardTitle}
                          onChange={(e) => setBoardTitle(e.target.value)}
                          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm text-lg font-medium"
                          placeholder="e.g., Sprint Planning, Marketing Campaign"
                          required
                        />
                        {boardTitle.trim() && (
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-1">
                        Choose a descriptive name for your board
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Description
                        <span className="ml-2 text-xs text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <textarea
                          value={boardDescription}
                          onChange={(e) => setBoardDescription(e.target.value)}
                          rows={4}
                          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm resize-none text-base"
                          placeholder="Describe the purpose of this board, what tasks will be tracked, or any specific context..."
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-1">
                        Help your team understand what this board is for
                      </p>
                    </div>
                  </div>

                  {/* Board Preview */}
                  {boardTitle.trim() && (
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview
                      </h4>
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                            </svg>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">{boardTitle}</h5>
                            <p className="text-xs text-gray-500">Kanban Board</p>
                          </div>
                        </div>
                        {boardDescription && (
                          <p className="text-sm text-gray-600 line-clamp-2">{boardDescription}</p>
                        )}
                        <div className="mt-3 flex items-center text-xs text-gray-500">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Default columns: To Do, In Progress, Done
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateBoardModal(false);
                        setBoardTitle('');
                        setBoardDescription('');
                      }}
                      className="flex-1 px-6 py-4 text-base font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-200 border-2 border-transparent hover:border-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingBoard || !boardTitle.trim()}
                      className="group flex-1 px-6 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                    >
                      {creatingBoard ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Board...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>Create Board</span>
                          <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Board Creation Success Animation */}
        {boardCreated && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md mx-4 transform transition-all duration-500 scale-100">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mb-6 ">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Board Created!
              </h3>
              <p className="text-gray-600 mb-6">
                Your new Kanban board is ready. Start organizing your tasks and collaborating with your team.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setBoardCreated(false)}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setBoardCreated(false);
                    setShowCreateBoardModal(true);
                  }}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  Create Another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Board Settings Modal */}
        {showBoardSettings && editingBoard && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Board Settings
                </h3>
                <p className="text-gray-600">
                  Manage your board settings and options
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => openEditBoard(editingBoard)}
                  className="w-full flex items-center px-6 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-200 group"
                >
                  <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <div>
                    <div className="font-semibold">Edit Board</div>
                    <div className="text-sm text-gray-500">Change title and description</div>
                  </div>
                </button>

                <button
                  onClick={() => handleDeleteBoard(editingBoard.id)}
                  className="w-full flex items-center px-6 py-4 text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200 group"
                >
                  <svg className="w-5 h-5 mr-3 text-red-400 group-hover:text-red-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <div>
                    <div className="font-semibold">Delete Board</div>
                    <div className="text-sm text-red-500">Permanently remove this board</div>
                  </div>
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowBoardSettings(false)}
                  className="w-full px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Board Modal */}
        {showEditBoardModal && editingBoard && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            </div>

            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-lg transform transition-all duration-500 scale-100">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full -translate-y-20 translate-x-20 opacity-60"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full translate-y-16 -translate-x-16 opacity-40"></div>
              
              <div className="relative p-10">
                {/* Header */}
                <div className="text-center mb-10">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl group">
                    <svg className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
                    Edit Board
                  </h3>
                  <p className="text-gray-600 text-base">
                    Update your board information
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleEditBoard} className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Board Title *
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={editBoardTitle}
                          onChange={(e) => setEditBoardTitle(e.target.value)}
                          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm text-lg font-medium"
                          placeholder="e.g., Sprint Planning, Marketing Campaign"
                          required
                        />
                        {editBoardTitle.trim() && (
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Description
                        <span className="ml-2 text-xs text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <textarea
                          value={editBoardDescription}
                          onChange={(e) => setEditBoardDescription(e.target.value)}
                          rows={4}
                          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm resize-none text-base"
                          placeholder="Describe the purpose of this board, what tasks will be tracked, or any specific context..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditBoardModal(false);
                        setEditBoardTitle('');
                        setEditBoardDescription('');
                        setEditingBoard(null);
                      }}
                      className="flex-1 px-6 py-4 text-base font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-200 border-2 border-transparent hover:border-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingBoard || !editBoardTitle.trim()}
                      className="group flex-1 px-6 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                    >
                      {updatingBoard ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating Board...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>Update Board</span>
                          <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Creation Success Animation */}
        {workspaceCreated && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md mx-4 transform transition-all duration-500 scale-100">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6 ">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Workspace Created!
              </h3>
              <p className="text-gray-600 mb-6">
                Your new workspace is ready. Start organizing your projects and collaborating with your team.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setWorkspaceCreated(false)}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setWorkspaceCreated(false);
                    setShowCreateModal(true);
                  }}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                >
                  Create Another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Workspace Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            </div>

            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-lg transform transition-all duration-500 scale-100">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-20 translate-x-20 opacity-60"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full translate-y-16 -translate-x-16 opacity-40"></div>
              
              <div className="relative p-10">
                {/* Header */}
                <div className="text-center mb-10">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl group">
                    <svg className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
                    Create New Workspace
                  </h3>
                  <p className="text-gray-600 text-base">
                    Set up a collaborative space for your team to organize and manage projects
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleCreateWorkspace} className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Workspace Name *
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/70 backdrop-blur-sm text-lg font-medium"
                          placeholder="e.g., Marketing Team, Product Development"
                          required
                        />
                        {workspaceName.trim() && (
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-1">
                        Choose a name that reflects your team or project
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Description
                        <span className="ml-2 text-xs text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <textarea
                          value={workspaceDescription}
                          onChange={(e) => setWorkspaceDescription(e.target.value)}
                          rows={4}
                          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/70 backdrop-blur-sm resize-none text-base"
                          placeholder="Describe what this workspace is for, your team goals, or any specific context..."
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-1">
                        Help your team understand the purpose of this workspace
                      </p>
                    </div>
                  </div>

                  {/* Workspace Preview */}
                  {workspaceName.trim() && (
                    <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl p-6 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview
                      </h4>
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">{workspaceName}</h5>
                            <p className="text-xs text-gray-500">Owner</p>
                          </div>
                        </div>
                        {workspaceDescription && (
                          <p className="text-sm text-gray-600 line-clamp-2">{workspaceDescription}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setWorkspaceName('');
                        setWorkspaceDescription('');
                      }}
                      className="flex-1 px-6 py-4 text-base font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-200 border-2 border-transparent hover:border-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating || !workspaceName.trim()}
                      className="group flex-1 px-6 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                    >
                      {creating ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Workspace...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>Create Workspace</span>
                          <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Task Details Modal */}
        {showTaskDetailsModal && editingTask && (
          <TaskDetailsModal
            task={editingTask}
            users={users}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
            onClose={() => {
              setShowTaskDetailsModal(false);
              setEditingTask(null);
            }}
          />
        )}

        {/* Enhanced Workspace Settings Modal */}
        {showWorkspaceSettings && selectedWorkspace && (
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
                <div className="flex items-center justify-between mb-10 " style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl animate-pulse-slow group">
                      <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent animate-shimmer">
                        Workspace Settings
                      </h3>
                      <p className="text-gray-600 text-base font-medium">
                        Manage your workspace and team members
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowWorkspaceSettings(false)}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-all duration-200 group"
                  >
                    <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Workspace Info */}
                  <div className="space-y-8">
                    {/* Workspace Information */}
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 border border-gray-200">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mr-4">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">Workspace Information</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Name</p>
                            <p className="text-lg font-bold text-gray-900">{selectedWorkspace.name}</p>
                          </div>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Description</p>
                            <p className="text-base text-gray-600">{selectedWorkspace.description || 'No description provided'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Created</p>
                            <p className="text-base text-gray-600">{new Date(selectedWorkspace.created_at).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Workspace Statistics */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border border-gray-200">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg mr-4">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">Statistics</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                          <div className="text-2xl font-bold text-indigo-600 mb-1">{boards.length}</div>
                          <div className="text-sm text-gray-600 font-medium">Boards</div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                          <div className="text-2xl font-bold text-green-600 mb-1">{workspaceMembers.length}</div>
                          <div className="text-sm text-gray-600 font-medium">Members</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Member Management */}
                  <div className="space-y-8">
                    {/* Invite Members - Only for workspace owners */}
                    {selectedWorkspace && currentUserId && selectedWorkspace.created_by === currentUserId && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-gray-200">
                        <div className="flex items-center mb-6">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg mr-4">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <h4 className="text-xl font-bold text-gray-900">Invite Members</h4>
                        </div>
                        
                        <form onSubmit={handleInviteUser} className="space-y-4">
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                              </svg>
                            </div>
                            <input
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/70 backdrop-blur-sm text-lg font-medium"
                              placeholder="Enter email address"
                              required
                            />
                          </div>
                          
                          <button
                            type="submit"
                            disabled={inviting}
                            className="group w-full px-6 py-4 text-base font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                          >
                            {inviting ? (
                              <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending Invitation...
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <span>Send Invitation</span>
                                <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                              </div>
                            )}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Workspace Members */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-gray-200">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mr-4">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">Team Members</h4>
                      </div>
                      
                      <div className="space-y-3">
                        {workspaceMembers.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <p className="text-gray-500 text-sm font-medium">No members yet</p>
                            <p className="text-gray-400 text-xs mt-1">Invite team members to get started</p>
                          </div>
                        ) : (
                          workspaceMembers.map((member: any, index: number) => (
                            <div 
                              key={member.id} 
                              className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-200 hover:shadow-md"
                              style={{
                                animationDelay: `${index * 100}ms`,
                                animation: 'fadeInUp 0.4s ease-out forwards'
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                                  {(member.name || member.email).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                                    {member.name || member.email}
                                  </p>
                                  <p className="text-sm text-gray-500">{member.email}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  member.role === 'owner' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                  member.status === 'accepted' ? 'bg-green-100 text-green-800 border border-green-200' :
                                  member.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                  'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                  {member.role === 'owner' ? 'Owner' : 
                                   member.status === 'accepted' ? 'Active' :
                                   member.status === 'pending' ? 'Pending' : 'Member'}
                                </span>
                                
                                {member.role !== 'owner' && (
                                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-10 pt-8 border-t border-gray-200 flex justify-between items-center">
                  {/* Delete Workspace Button - Only for workspace owners */}
                  {selectedWorkspace && currentUserId && selectedWorkspace.created_by === currentUserId && (
                    <button
                      onClick={() => setShowDeleteWorkspaceConfirm(true)}
                      className="px-6 py-3 text-base font-semibold text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 border-2 border-transparent hover:border-red-200 group"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Workspace
                      </div>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowWorkspaceSettings(false)}
                    className="px-8 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-200 border-2 border-transparent hover:border-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Delete Workspace Confirmation Modal */}
        {showDeleteWorkspaceConfirm && selectedWorkspace && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4 animate-backdrop-fade-in">
            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-md transform transition-all duration-500 scale-100 animate-modal-slide-in z-[101]">
              <div className="p-8">
                <div className="flex items-center space-x-4 mb-6 " style={{ animationDelay: '0.2s' }}>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse-slow group">
                    <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 animate-shimmer">Delete Workspace</h3>
                    <p className="text-gray-600">This action cannot be undone</p>
                  </div>
                </div>
                
                <div className="mb-8 " style={{ animationDelay: '0.4s' }}>
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to delete <strong>"{selectedWorkspace.name}"</strong>? This will permanently remove:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 ml-4">
                    <li className="flex items-center " style={{ animationDelay: '0.6s' }}>
                      <svg className="w-4 h-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      All boards and tasks
                    </li>
                    <li className="flex items-center " style={{ animationDelay: '0.8s' }}>
                      <svg className="w-4 h-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      All team members and invitations
                    </li>
                    <li className="flex items-center " style={{ animationDelay: '1.0s' }}>
                      <svg className="w-4 h-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      All workspace data
                    </li>
                  </ul>
                </div>
                
                <div className="flex justify-end space-x-4 " style={{ animationDelay: '1.2s' }}>
                  <button
                    onClick={() => setShowDeleteWorkspaceConfirm(false)}
                    className="px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-300 hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteWorkspace}
                    disabled={deletingWorkspace}
                    className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
                  >
                    {deletingWorkspace ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </div>
                    ) : (
                      'Delete Workspace'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Workspace Modal from Card */}
        {showDeleteModal && workspaceToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4 animate-backdrop-fade-in">
            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-md transform transition-all duration-500 scale-100 animate-modal-slide-in z-[101]">
              {/* Background decoration */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400 to-rose-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse-slow"></div>
              </div>
              
              <div className="relative p-8">
                {/* Enhanced Header */}
                <div className="flex items-center space-x-4 mb-6 " style={{ animationDelay: '0.2s' }}>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse-slow group">
                    <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-red-600 bg-clip-text text-transparent animate-shimmer">
                      Delete Workspace
                    </h3>
                    <p className="text-gray-600 font-medium">This action cannot be undone</p>
                  </div>
                </div>
                
                <div className="mb-8 " style={{ animationDelay: '0.4s' }}>
                  <p className="text-gray-700 mb-4 font-medium">
                    Are you sure you want to delete <strong className="text-red-600">"{workspaceToDelete.name}"</strong>? This will permanently remove:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 ml-4">
                    <li className="flex items-center " style={{ animationDelay: '0.6s' }}>
                      <svg className="w-4 h-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      All boards and tasks
                    </li>
                    <li className="flex items-center " style={{ animationDelay: '0.8s' }}>
                      <svg className="w-4 h-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      All team members and invitations
                    </li>
                    <li className="flex items-center " style={{ animationDelay: '1.0s' }}>
                      <svg className="w-4 h-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      All workspace data
                    </li>
                  </ul>
                </div>
                
                <div className="flex justify-end space-x-4 " style={{ animationDelay: '1.2s' }}>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setWorkspaceToDelete(null);
                    }}
                    className="px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-300 hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteWorkspaceFromCard}
                    disabled={deletingWorkspace}
                    className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
                  >
                    {deletingWorkspace ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </div>
                    ) : (
                      'Delete Workspace'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Delete Board Confirmation Modal */}
        {showDeleteBoardModal && boardToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4 animate-backdrop-fade-in">
            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-md transform transition-all duration-500 scale-100 animate-modal-slide-in z-[101]">
              {/* Background decoration */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400 to-rose-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse-slow"></div>
              </div>
              
              <div className="relative p-10">
                {/* Enhanced Header */}
                <div className="text-center mb-8 " style={{ animationDelay: '0.2s' }}>
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl animate-pulse-slow group">
                    <svg className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-red-600 to-rose-600 bg-clip-text text-transparent animate-shimmer">
                    Delete Board
                  </h3>
                  <p className="mt-3 text-lg text-gray-600 font-medium">
                    This action cannot be undone
                  </p>
                </div>

                {/* Board Information */}
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 mb-8 " style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {boardToDelete.title}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {boardToDelete.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6 mb-8 " style={{ animationDelay: '0.6s' }}>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-lg font-semibold text-red-800 mb-2">
                        Warning: Permanent Deletion
                      </h5>
                      <p className="text-red-700 text-sm leading-relaxed">
                        This will permanently delete the board and all its tasks. This action cannot be undone and all data will be lost forever.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 " style={{ animationDelay: '0.8s' }}>
                  <button
                    onClick={() => {
                      setShowDeleteBoardModal(false);
                      setBoardToDelete(null);
                    }}
                    className="flex-1 py-4 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteBoard}
                    disabled={deletingBoard}
                    className="flex-1 py-4 px-6 border border-transparent text-white font-semibold rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    {deletingBoard ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </div>
                    ) : (
                      'Delete Board'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-3">
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              className="transform transition-all duration-500 ease-out"
              style={{
                animationDelay: `${index * 150}ms`,
                animation: 'slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              <div className="" style={{ animationDelay: `${index * 150 + 200}ms` }}>
                <NotificationToast
                  message={notification.message}
                  type={notification.type as any}
                  onClose={() => removeNotification(notification.id)}
                  duration={6000}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 relative overflow-hidden flex items-center justify-center">
      {/* Enhanced Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse-slow"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-float" style={{ animationDelay: '6s' }}></div>
      </div>

      <div className="relative max-w-md w-full z-10">
        {/* Enhanced Main Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-10 space-y-8 ">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-16 translate-x-16 opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full translate-y-12 -translate-x-12 opacity-40"></div>
          
          {/* Enhanced Header */}
          <div className="text-center relative">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl animate-pulse-slow group">
              <svg className="h-10 w-10 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-shimmer">
              Kanban Project Management
            </h2>
            <p className="mt-3 text-lg text-gray-600 font-medium">
              Welcome to the Kanban application
            </p>
          </div>
          
          {/* Enhanced Action Buttons */}
          <div className="space-y-4 " style={{ animationDelay: '0.2s' }}>
            <a
              href="/auth/login"
              className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              <div className="flex items-center">
                <span>Sign In</span>
                <svg className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </a>
            
            <a
              href="/auth/signup"
              className="group relative w-full flex justify-center py-4 px-6 border-2 border-indigo-600 text-lg font-semibold rounded-2xl text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="flex items-center">
                <span>Sign Up</span>
                <svg className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
