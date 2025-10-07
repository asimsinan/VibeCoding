// Database seeding for Kanban application
import { createClient } from '@supabase/supabase-js';
import { UserModel } from '../models/user.model';
import { WorkspaceModel } from '../models/workspace.model';
import { BoardModel } from '../models/board.model';
import { TaskModel } from '../models/task.model';

export interface SeedData {
  users: Array<{
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  }>;
  workspaces: Array<{
    name: string;
    description?: string;
    created_by: string;
  }>;
  boards: Array<{
    title: string;
    description?: string;
    workspace_id: string;
    created_by: string;
  }>;
  tasks: Array<{
    title: string;
    description?: string;
    board_id: string;
    column_id: string;
    position: number;
    status: 'todo' | 'in_progress' | 'done' | 'archived';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignee_id?: string;
    due_date?: string;
    created_by: string;
  }>;
}

export class DatabaseSeeder {
  private supabase: any;
  private userModel: UserModel;
  private workspaceModel: WorkspaceModel;
  private boardModel: BoardModel;
  private taskModel: TaskModel;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.userModel = new UserModel(supabaseUrl, supabaseKey);
    this.workspaceModel = new WorkspaceModel(supabaseUrl, supabaseKey);
    this.boardModel = new BoardModel(supabaseUrl, supabaseKey);
    this.taskModel = new TaskModel(supabaseUrl, supabaseKey);
  }

  /**
   * Clear all data from database
   */
  async clearDatabase(): Promise<void> {
    console.log('🧹 Clearing database...');
    
    // Delete in reverse order of dependencies
    await this.supabase.from('user_activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('task_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('columns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('boards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('workspace_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('workspaces').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Database cleared');
  }

  /**
   * Seed the database with test data
   */
  async seed(seedData: SeedData): Promise<void> {
    console.log('🌱 Seeding database...');

    try {
      // Create users
      console.log('👥 Creating users...');
      const createdUsers = [];
      for (const userData of seedData.users) {
        const user = await this.userModel.createProfile({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar_url: userData.avatar_url,
          preferences: {
            theme: 'system',
            notifications: {
              email: true,
              push: true,
              task_assigned: true,
              task_due: true,
              task_completed: false,
            },
          },
        });
        createdUsers.push(user);
        console.log(`  ✅ Created user: ${user.name} (${user.email})`);
      }

      // Create workspaces
      console.log('🏢 Creating workspaces...');
      const createdWorkspaces = [];
      for (const workspaceData of seedData.workspaces) {
        const workspace = await this.workspaceModel.createWorkspace(workspaceData);
        createdWorkspaces.push(workspace);
        console.log(`  ✅ Created workspace: ${workspace.name}`);
      }

      // Create boards
      console.log('📋 Creating boards...');
      const createdBoards = [];
      for (const boardData of seedData.boards) {
        const board = await this.boardModel.createBoard(boardData);
        createdBoards.push(board);
        console.log(`  ✅ Created board: ${board.title}`);
      }

      // Get columns for each board (created automatically by trigger)
      console.log('📊 Getting board columns...');
      const boardColumns = new Map();
      for (const board of createdBoards) {
        const columns = await this.boardModel.getBoardColumns(board.id);
        boardColumns.set(board.id, columns);
        console.log(`  ✅ Found ${columns.length} columns for board: ${board.title}`);
      }

      // Create tasks
      console.log('✅ Creating tasks...');
      for (const taskData of seedData.tasks) {
        const task = await this.taskModel.createTask(taskData);
        console.log(`  ✅ Created task: ${task.title}`);
      }

      console.log('🎉 Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Generate sample seed data
   */
  generateSampleData(): SeedData {
    const userId1 = '550e8400-e29b-41d4-a716-446655440001';
    const userId2 = '550e8400-e29b-41d4-a716-446655440002';
    const userId3 = '550e8400-e29b-41d4-a716-446655440003';

    return {
      users: [
        {
          id: userId1,
          email: 'john.doe@example.com',
          name: 'John Doe',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        },
        {
          id: userId2,
          email: 'jane.smith@example.com',
          name: 'Jane Smith',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
        },
        {
          id: userId3,
          email: 'bob.wilson@example.com',
          name: 'Bob Wilson',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
        },
      ],
      workspaces: [
        {
          name: 'Acme Corp',
          description: 'Main workspace for Acme Corporation',
          created_by: userId1,
        },
        {
          name: 'Side Projects',
          description: 'Personal side projects and experiments',
          created_by: userId1,
        },
      ],
      boards: [
        {
          title: 'Product Development',
          description: 'Main product development board',
          workspace_id: '550e8400-e29b-41d4-a716-446655440101', // Will be replaced with actual ID
          created_by: userId1,
        },
        {
          title: 'Marketing Campaign',
          description: 'Q1 marketing campaign planning',
          workspace_id: '550e8400-e29b-41d4-a716-446655440101', // Will be replaced with actual ID
          created_by: userId2,
        },
        {
          title: 'Personal Tasks',
          description: 'Personal productivity board',
          workspace_id: '550e8400-e29b-41d4-a716-446655440102', // Will be replaced with actual ID
          created_by: userId1,
        },
      ],
      tasks: [
        // Product Development board tasks
        {
          title: 'Design new user interface',
          description: 'Create wireframes and mockups for the new dashboard',
          board_id: '550e8400-e29b-41d4-a716-446655440201', // Will be replaced with actual ID
          column_id: '550e8400-e29b-41d4-a716-446655440301', // To Do column
          position: 0,
          status: 'todo',
          priority: 'high',
          assignee_id: userId2,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          created_by: userId1,
        },
        {
          title: 'Implement authentication system',
          description: 'Set up user authentication and authorization',
          board_id: '550e8400-e29b-41d4-a716-446655440201',
          column_id: '550e8400-e29b-41d4-a716-446655440301',
          position: 1,
          status: 'todo',
          priority: 'urgent',
          assignee_id: userId3,
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          created_by: userId1,
        },
        {
          title: 'Write API documentation',
          description: 'Document all API endpoints and usage examples',
          board_id: '550e8400-e29b-41d4-a716-446655440201',
          column_id: '550e8400-e29b-41d4-a716-446655440302', // In Progress column
          position: 0,
          status: 'in_progress',
          priority: 'medium',
          assignee_id: userId1,
          created_by: userId1,
        },
        {
          title: 'Set up CI/CD pipeline',
          description: 'Configure automated testing and deployment',
          board_id: '550e8400-e29b-41d4-a716-446655440201',
          column_id: '550e8400-e29b-41d4-a716-446655440303', // Done column
          position: 0,
          status: 'done',
          priority: 'high',
          assignee_id: userId3,
          created_by: userId1,
        },
        // Marketing Campaign board tasks
        {
          title: 'Create social media content',
          description: 'Design posts for Instagram, Twitter, and LinkedIn',
          board_id: '550e8400-e29b-41d4-a716-446655440202',
          column_id: '550e8400-e29b-41d4-a716-446655440304', // To Do column
          position: 0,
          status: 'todo',
          priority: 'medium',
          assignee_id: userId2,
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          created_by: userId2,
        },
        {
          title: 'Plan email campaign',
          description: 'Design email templates and schedule send dates',
          board_id: '550e8400-e29b-41d4-a716-446655440202',
          column_id: '550e8400-e29b-41d4-a716-446655440305', // In Progress column
          position: 0,
          status: 'in_progress',
          priority: 'high',
          assignee_id: userId2,
          created_by: userId2,
        },
        // Personal Tasks board tasks
        {
          title: 'Read React documentation',
          description: 'Catch up on latest React features and best practices',
          board_id: '550e8400-e29b-41d4-a716-446655440203',
          column_id: '550e8400-e29b-41d4-a716-446655440306', // To Do column
          position: 0,
          status: 'todo',
          priority: 'low',
          created_by: userId1,
        },
        {
          title: 'Update portfolio website',
          description: 'Add new projects and update design',
          board_id: '550e8400-e29b-41d4-a716-446655440203',
          column_id: '550e8400-e29b-41d4-a716-446655440307', // In Progress column
          position: 0,
          status: 'in_progress',
          priority: 'medium',
          created_by: userId1,
        },
      ],
    };
  }

  /**
   * Seed with sample data
   */
  async seedWithSampleData(): Promise<void> {
    const sampleData = this.generateSampleData();
    await this.seed(sampleData);
  }

  /**
   * Seed for testing
   */
  async seedForTesting(): Promise<SeedData> {
    const testData: SeedData = {
      users: [
        {
          id: 'test-user-1',
          email: 'test@example.com',
          name: 'Test User',
        },
      ],
      workspaces: [
        {
          name: 'Test Workspace',
          description: 'A workspace for testing',
          created_by: 'test-user-1',
        },
      ],
      boards: [
        {
          title: 'Test Board',
          description: 'A board for testing',
          workspace_id: 'test-workspace-1',
          created_by: 'test-user-1',
        },
      ],
      tasks: [
        {
          title: 'Test Task',
          description: 'A task for testing',
          board_id: 'test-board-1',
          column_id: 'test-column-1',
          position: 0,
          status: 'todo',
          priority: 'medium',
          created_by: 'test-user-1',
        },
      ],
    };

    await this.seed(testData);
    return testData;
  }
}
