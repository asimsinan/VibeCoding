#!/usr/bin/env node

/**
 * Kanban CLI Interface
 * Provides command-line interface for the Kanban library
 */

import { program } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';

// Import library modules
import { AuthService } from '../lib/auth';
import { WorkspaceService } from '../lib/workspace';
import { BoardService } from '../lib/board';
import { TaskService } from '../lib/task';
import { createApiDocsCommand } from './commands/apiDocs';
import { createGenerateOpenAPICommand } from './commands/generateOpenAPI';

interface CLIOptions {
  json?: boolean;
  verbose?: boolean;
  config?: string;
}

interface CLIResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

class KanbanCLI {
  private options: CLIOptions;

  constructor() {
    this.options = {
      json: false,
      verbose: false,
    };
  }

  private log(message: string, data?: any): void {
    if (this.options.verbose) {
      if (this.options.json) {
        console.error(JSON.stringify({ message, data, timestamp: new Date().toISOString() }));
      } else {
        console.error(`[${new Date().toISOString()}] ${message}`, data || '');
      }
    }
  }

  private output(result: CLIResult): void {
    if (this.options.json) {
      console.log(JSON.stringify(result));
    } else {
      if (result.success) {
        console.log('✓ Success:', result.data || 'Operation completed');
      } else {
        console.error('✗ Error:', result.error || 'Operation failed');
        process.exit(1);
      }
    }
  }

  private async handleError(error: any, operation: string): Promise<CLIResult> {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    this.log(`Error in ${operation}:`, error);
    
    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }

  // Auth commands
  async signUp(email: string, password: string, name?: string): Promise<CLIResult> {
    try {
      this.log('Signing up user', { email, name });
      const result = await AuthService.signUp(email, password, name);
      
      return {
        success: true,
        data: { user: result.user, session: result.session },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.handleError(error, 'signUp');
    }
  }

  async signIn(email: string, password: string): Promise<CLIResult> {
    try {
      this.log('Signing in user', { email });
      const result = await AuthService.signIn(email, password);
      
      return {
        success: true,
        data: { user: result.user, session: result.session },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.handleError(error, 'signIn');
    }
  }

  async signOut(): Promise<CLIResult> {
    try {
      this.log('Signing out user');
      await AuthService.signOut();
      
      return {
        success: true,
        data: { message: 'User signed out successfully' },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.handleError(error, 'signOut');
    }
  }

  // Workspace commands
  async createWorkspace(name: string, description?: string, userId?: string): Promise<CLIResult> {
    try {
      if (!userId) {
        throw new Error('User ID is required for workspace creation');
      }

      this.log('Creating workspace', { name, description, userId });
      const workspaceService = new WorkspaceService();
      const result = await workspaceService.createWorkspace({
        name,
        description,
        created_by: userId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create workspace');
      }

      return {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.handleError(error, 'createWorkspace');
    }
  }

  async listWorkspaces(userId: string): Promise<CLIResult> {
    try {
      this.log('Listing workspaces', { userId });
      const workspaceService = new WorkspaceService();
      const result = await workspaceService.getUserWorkspaces(userId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to list workspaces');
      }

      return {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.handleError(error, 'listWorkspaces');
    }
  }

  // Board commands
  async createBoard(title: string, workspaceId: string, description?: string, userId?: string): Promise<CLIResult> {
    try {
      if (!userId) {
        throw new Error('User ID is required for board creation');
      }

      this.log('Creating board', { title, workspaceId, description, userId });
      const boardService = new BoardService();
      const result = await boardService.createBoard({
        title,
        description,
        workspace_id: workspaceId,
        created_by: userId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create board');
      }

      return {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.handleError(error, 'createBoard');
    }
  }

  async listBoards(workspaceId: string): Promise<CLIResult> {
    try {
      this.log('Listing boards', { workspaceId });
      const boardService = new BoardService();
      const result = await boardService.getBoardsByWorkspace(workspaceId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to list boards');
      }

      return {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.handleError(error, 'listBoards');
    }
  }

  // Task commands
  async createTask(title: string, boardId: string, columnId: string, userId: string, description?: string): Promise<CLIResult> {
    try {
      this.log('Creating task', { title, boardId, columnId, description, userId });
      const taskService = new TaskService();
      const result = await taskService.createTask({
        title,
        description,
        board_id: boardId,
        column_id: columnId,
        position: 0,
        status: 'todo',
        priority: 'medium',
        created_by: userId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create task');
      }

      return {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.handleError(error, 'createTask');
    }
  }

  async listTasks(boardId: string): Promise<CLIResult> {
    try {
      this.log('Listing tasks', { boardId });
      const taskService = new TaskService();
      const result = await taskService.getTasksByBoard(boardId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to list tasks');
      }

      return {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.handleError(error, 'listTasks');
    }
  }

  // JSON input processing
  async processJsonInput(): Promise<void> {
    try {
      let input = '';
      
      process.stdin.on('data', (chunk) => {
        input += chunk.toString();
      });

      process.stdin.on('end', async () => {
        try {
          const command = JSON.parse(input);
          await this.executeCommand(command);
        } catch (error) {
          this.output({
            success: false,
            error: 'Invalid JSON input',
            timestamp: new Date().toISOString(),
          });
        }
      });
    } catch (error) {
      this.output(await this.handleError(error, 'processJsonInput'));
    }
  }

  private async executeCommand(command: any): Promise<void> {
    const { action, ...params } = command;

    switch (action) {
      case 'signUp':
        await this.signUp(params.email, params.password, params.name).then(this.output.bind(this));
        break;
      case 'signIn':
        await this.signIn(params.email, params.password).then(this.output.bind(this));
        break;
      case 'signOut':
        await this.signOut().then(this.output.bind(this));
        break;
      case 'createWorkspace':
        await this.createWorkspace(params.name, params.description, params.userId).then(this.output.bind(this));
        break;
      case 'listWorkspaces':
        await this.listWorkspaces(params.userId).then(this.output.bind(this));
        break;
      case 'createBoard':
        await this.createBoard(params.title, params.workspaceId, params.description, params.userId).then(this.output.bind(this));
        break;
      case 'listBoards':
        await this.listBoards(params.workspaceId).then(this.output.bind(this));
        break;
      case 'createTask':
        await this.createTask(params.title, params.boardId, params.columnId, params.userId, params.description).then(this.output.bind(this));
        break;
      case 'listTasks':
        await this.listTasks(params.boardId).then(this.output.bind(this));
        break;
      default:
        this.output({
          success: false,
          error: `Unknown action: ${action}`,
          timestamp: new Date().toISOString(),
        });
    }
  }

  setupCommands(): void {
    program
      .name('kanban-cli')
      .description('Kanban Project Management CLI')
      .version('1.0.0')
      .option('-j, --json', 'Output in JSON format')
      .option('-v, --verbose', 'Enable verbose logging')
      .option('-c, --config <path>', 'Path to config file');

    // Auth commands
    program
      .command('auth:signup')
      .description('Sign up a new user')
      .argument('<email>', 'User email')
      .argument('<password>', 'User password')
      .option('-n, --name <name>', 'User name')
      .action(async (email, password, options) => {
        this.options = { ...this.options, ...program.opts() };
        const result = await this.signUp(email, password, options.name);
        this.output(result);
      });

    program
      .command('auth:signin')
      .description('Sign in a user')
      .argument('<email>', 'User email')
      .argument('<password>', 'User password')
      .action(async (email, password) => {
        this.options = { ...this.options, ...program.opts() };
        const result = await this.signIn(email, password);
        this.output(result);
      });

    program
      .command('auth:signout')
      .description('Sign out current user')
      .action(async () => {
        this.options = { ...this.options, ...program.opts() };
        const result = await this.signOut();
        this.output(result);
      });

    // Workspace commands
    program
      .command('workspace:create')
      .description('Create a new workspace')
      .argument('<name>', 'Workspace name')
      .option('-d, --description <description>', 'Workspace description')
      .option('-u, --user-id <userId>', 'User ID')
      .action(async (name, options) => {
        this.options = { ...this.options, ...program.opts() };
        const result = await this.createWorkspace(name, options.description, options.userId);
        this.output(result);
      });

    program
      .command('workspace:list')
      .description('List user workspaces')
      .argument('<userId>', 'User ID')
      .action(async (userId) => {
        this.options = { ...this.options, ...program.opts() };
        const result = await this.listWorkspaces(userId);
        this.output(result);
      });

    // Board commands
    program
      .command('board:create')
      .description('Create a new board')
      .argument('<title>', 'Board title')
      .argument('<workspaceId>', 'Workspace ID')
      .option('-d, --description <description>', 'Board description')
      .option('-u, --user-id <userId>', 'User ID')
      .action(async (title, workspaceId, options) => {
        this.options = { ...this.options, ...program.opts() };
        const result = await this.createBoard(title, workspaceId, options.description, options.userId);
        this.output(result);
      });

    program
      .command('board:list')
      .description('List workspace boards')
      .argument('<workspaceId>', 'Workspace ID')
      .action(async (workspaceId) => {
        this.options = { ...this.options, ...program.opts() };
        const result = await this.listBoards(workspaceId);
        this.output(result);
      });

    // Task commands
    program
      .command('task:create')
      .description('Create a new task')
      .argument('<title>', 'Task title')
      .argument('<boardId>', 'Board ID')
      .argument('<columnId>', 'Column ID')
      .argument('<userId>', 'User ID')
      .option('-d, --description <description>', 'Task description')
      .action(async (title, boardId, columnId, userId, options) => {
        this.options = { ...this.options, ...program.opts() };
        const result = await this.createTask(title, boardId, columnId, userId, options.description);
        this.output(result);
      });

    program
      .command('task:list')
      .description('List board tasks')
      .argument('<boardId>', 'Board ID')
      .action(async (boardId) => {
        this.options = { ...this.options, ...program.opts() };
        const result = await this.listTasks(boardId);
        this.output(result);
      });

    // API Documentation commands
    program.addCommand(createApiDocsCommand());
    program.addCommand(createGenerateOpenAPICommand());

    // JSON mode
    program
      .command('json')
      .description('Process JSON input from stdin')
      .action(async () => {
        this.options = { ...this.options, ...program.opts(), json: true };
        await this.processJsonInput();
      });
  }

  async run(): Promise<void> {
    this.setupCommands();
    await program.parseAsync();
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new KanbanCLI();
  cli.run().catch((error) => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}

export { KanbanCLI };
