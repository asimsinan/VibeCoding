/**
 * Data Transformers
 * Utilities for transforming API data for UI consumption
 */

// Transform workspace data
export function transformWorkspace(workspace: any) {
  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    created_at: workspace.created_at,
    updated_at: workspace.updated_at,
    member_count: workspace.member_count || 0,
    // Add computed fields
    is_active: workspace.is_active !== false,
    display_name: workspace.name,
    slug: workspace.name.toLowerCase().replace(/\s+/g, '-'),
  };
}

// Transform board data
export function transformBoard(board: any) {
  return {
    id: board.id,
    title: board.title,
    description: board.description,
    workspace_id: board.workspace_id,
    created_at: board.created_at,
    updated_at: board.updated_at,
    // Add computed fields
    is_active: board.is_active !== false,
    display_name: board.title,
    slug: board.title.toLowerCase().replace(/\s+/g, '-'),
  };
}

// Transform column data
export function transformColumn(column: any) {
  return {
    id: column.id,
    title: column.title,
    position: column.position,
    board_id: column.board_id,
    created_at: column.created_at,
    updated_at: column.updated_at,
    // Add computed fields
    is_active: column.is_active !== false,
    display_name: column.title,
    slug: column.title.toLowerCase().replace(/\s+/g, '-'),
  };
}

// Transform task data
export function transformTask(task: any) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignee_id: task.assignee_id,
    due_date: task.due_date,
    position: task.position,
    column_id: task.column_id,
    board_id: task.board_id,
    created_at: task.created_at,
    updated_at: task.updated_at,
    created_by: task.created_by,
    // Add computed fields
    is_overdue: task.due_date ? new Date(task.due_date) < new Date() : false,
    is_high_priority: task.priority === 'high' || task.priority === 'urgent',
    display_name: task.title,
    slug: task.title.toLowerCase().replace(/\s+/g, '-'),
    // Format dates
    due_date_formatted: task.due_date ? formatDate(task.due_date) : null,
    created_at_formatted: formatDate(task.created_at),
    updated_at_formatted: formatDate(task.updated_at),
  };
}

// Transform user data
export function transformUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
    created_at: user.created_at,
    updated_at: user.updated_at,
    // Add computed fields
    display_name: user.name || user.email,
    initials: getInitials(user.name || user.email),
    is_active: user.is_active !== false,
  };
}

// Utility functions
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return date.toLocaleDateString();
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Batch transformation functions
export function transformWorkspaces(workspaces: any[]) {
  return workspaces.map(transformWorkspace);
}

export function transformBoards(boards: any[]) {
  return boards.map(transformBoard);
}

export function transformColumns(columns: any[]) {
  return columns.map(transformColumn);
}

export function transformTasks(tasks: any[]) {
  return tasks.map(transformTask);
}

export function transformUsers(users: any[]) {
  return users.map(transformUser);
}

// Filter and sort utilities
export function filterTasksByStatus(tasks: any[], status: string) {
  return tasks.filter(task => task.status === status);
}

export function filterTasksByPriority(tasks: any[], priority: string) {
  return tasks.filter(task => task.priority === priority);
}

export function filterTasksByAssignee(tasks: any[], assigneeId: string) {
  return tasks.filter(task => task.assignee_id === assigneeId);
}

export function sortTasksByPosition(tasks: any[]) {
  return [...tasks].sort((a, b) => a.position - b.position);
}

export function sortTasksByDueDate(tasks: any[]) {
  return [...tasks].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
}

export function sortTasksByPriority(tasks: any[]) {
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  return [...tasks].sort((a, b) => 
    (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
    (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
  );
}

// Search utilities
export function searchTasks(tasks: any[], query: string) {
  const lowercaseQuery = query.toLowerCase();
  return tasks.filter(task => 
    task.title.toLowerCase().includes(lowercaseQuery) ||
    (task.description && task.description.toLowerCase().includes(lowercaseQuery))
  );
}

export function searchWorkspaces(workspaces: any[], query: string) {
  const lowercaseQuery = query.toLowerCase();
  return workspaces.filter(workspace => 
    workspace.name.toLowerCase().includes(lowercaseQuery) ||
    (workspace.description && workspace.description.toLowerCase().includes(lowercaseQuery))
  );
}

export function searchBoards(boards: any[], query: string) {
  const lowercaseQuery = query.toLowerCase();
  return boards.filter(board => 
    board.title.toLowerCase().includes(lowercaseQuery) ||
    (board.description && board.description.toLowerCase().includes(lowercaseQuery))
  );
}
