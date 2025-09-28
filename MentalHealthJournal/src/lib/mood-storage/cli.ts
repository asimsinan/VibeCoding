#!/usr/bin/env node
/**
 * Storage Library CLI Interface
 * 
 * Command-line interface for the mood storage library.
 * Supports --json mode with stdin/stdout for programmatic access.
 * 
 * @fileoverview CLI interface for storage operations
 * @author Mental Health Journal App
 * @version 1.0.0
 */

import { StorageService } from './services/StorageService';
import { DatabaseConfigManager } from './config/DatabaseConfig';

interface CLICommand {
  command: string;
  data?: any;
  options?: {
    json?: boolean;
    help?: boolean;
  };
}

interface CLIResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

class StorageCLI {
  private storageService: StorageService;
  private configManager: DatabaseConfigManager;

  constructor() {
    this.storageService = new StorageService();
    this.configManager = DatabaseConfigManager.getInstance();
  }

  /**
   * Main CLI entry point
   */
  async run(): Promise<void> {
    try {
      const args = process.argv.slice(2);
      const isJsonMode = args.includes('--json');
      const isHelp = args.includes('--help') || args.includes('-h');

      if (isHelp) {
        this.printHelp();
        return;
      }

      if (isJsonMode) {
        await this.handleJsonMode();
      } else {
        await this.handleInteractiveMode(args);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('CLI Error:', errorMessage);
      process.exit(1);
    }
  }

  /**
   * Handle JSON mode (stdin/stdout)
   */
  private async handleJsonMode(): Promise<void> {
    let input = '';
    
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (chunk) => {
      input += chunk;
    });

    process.stdin.on('end', async () => {
      try {
        const command: CLICommand = JSON.parse(input);
        const response = await this.executeCommand(command);
        console.log(JSON.stringify(response));
      } catch (error) {
        const errorResponse: CLIResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        };
        console.error(JSON.stringify(errorResponse));
        process.exit(1);
      }
    });
  }

  /**
   * Handle interactive mode
   */
  private async handleInteractiveMode(args: string[]): Promise<void> {
    if (args.length === 0) {
      this.printHelp();
      return;
    }

    const command = args[0];
    const commandArgs = args.slice(1);

    try {
      switch (command) {
        case 'init':
          await this.handleInit();
          break;
        case 'create':
          await this.handleCreate(commandArgs);
          break;
        case 'get':
          await this.handleGet(commandArgs);
          break;
        case 'update':
          await this.handleUpdate(commandArgs);
          break;
        case 'delete':
          await this.handleDelete(commandArgs);
          break;
        case 'sync':
          await this.handleSync();
          break;
        case 'stats':
          await this.handleStats();
          break;
        case 'export':
          await this.handleExport(commandArgs);
          break;
        case 'import':
          await this.handleImport(commandArgs);
          break;
        case 'health':
          await this.handleHealth();
          break;
        default:
          console.error(`Unknown command: ${command}`);
          this.printHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error('Command failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    } finally {
      await this.storageService.close();
    }
  }

  /**
   * Execute a command and return response
   */
  private async executeCommand(command: CLICommand): Promise<CLIResponse> {
    try {
      await this.storageService.initialize();

      switch (command.command) {
        case 'init':
          return {
            success: true,
            data: { message: 'Storage service initialized' },
            timestamp: new Date().toISOString(),
          };

        case 'create':
          const createData = command.data;
          if (!createData || !createData.rating || !createData.date) {
            throw new Error('Missing required fields: rating, date');
          }
          const created = await this.storageService.createMoodEntry(createData);
          return {
            success: true,
            data: created,
            timestamp: new Date().toISOString(),
          };

        case 'get':
          const getOptions = command.data || {};
          const entries = await this.storageService.getMoodEntries(getOptions);
          return {
            success: true,
            data: entries,
            timestamp: new Date().toISOString(),
          };

        case 'update':
          const { id, updates } = command.data || {};
          if (!id) {
            throw new Error('Missing required field: id');
          }
          const updated = await this.storageService.updateMoodEntry(id, updates);
          return {
            success: true,
            data: updated,
            timestamp: new Date().toISOString(),
          };

        case 'delete':
          const deleteId = command.data?.id;
          if (!deleteId) {
            throw new Error('Missing required field: id');
          }
          await this.storageService.deleteMoodEntry(deleteId);
          return {
            success: true,
            data: { message: 'Entry deleted successfully' },
            timestamp: new Date().toISOString(),
          };

        case 'sync':
          const syncResult = await this.storageService.syncData();
          return {
            success: syncResult.success,
            data: syncResult,
            timestamp: new Date().toISOString(),
          };

        case 'stats':
          const stats = await this.storageService.getStats();
          return {
            success: true,
            data: stats,
            timestamp: new Date().toISOString(),
          };

        case 'export':
          const exportData = await this.storageService.exportData();
          return {
            success: true,
            data: exportData,
            timestamp: new Date().toISOString(),
          };

        case 'health':
          const health = this.storageService.getHealthStatus();
          return {
            success: true,
            data: health,
            timestamp: new Date().toISOString(),
          };

        default:
          throw new Error(`Unknown command: ${command.command}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Handle init command
   */
  private async handleInit(): Promise<void> {
    await this.storageService.initialize();
    console.log('Storage service initialized successfully');
  }

  /**
   * Handle create command
   */
  private async handleCreate(args: string[]): Promise<void> {
    if (args.length < 2) {
      console.error('Usage: create <rating> <date> [notes]');
      process.exit(1);
    }

    const rating = parseInt(args[0], 10);
    const date = args[1];
    const notes = args[2];

    if (isNaN(rating) || rating < 1 || rating > 10) {
      console.error('Rating must be a number between 1 and 10');
      process.exit(1);
    }

    await this.storageService.initialize();
    const entry = await this.storageService.createMoodEntry({
      rating,
      date,
      entryDate: date, // Also provide entryDate for compatibility
      notes,
      userId: 'default-user', // TODO: Get actual user ID
      status: 'active' as any,
    });

    console.log('Mood entry created:', JSON.stringify(entry, null, 2));
  }

  /**
   * Handle get command
   */
  private async handleGet(args: string[]): Promise<void> {
    const options: any = {};
    
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i];
      const value = args[i + 1];
      
      switch (key) {
        case '--start-date':
          options.startDate = value;
          break;
        case '--end-date':
          options.endDate = value;
          break;
        case '--limit':
          options.limit = parseInt(value, 10);
          break;
        case '--offset':
          options.offset = parseInt(value, 10);
          break;
      }
    }

    await this.storageService.initialize();
    const entries = await this.storageService.getMoodEntries(options);
    console.log(JSON.stringify(entries, null, 2));
  }

  /**
   * Handle update command
   */
  private async handleUpdate(args: string[]): Promise<void> {
    if (args.length < 3) {
      console.error('Usage: update <id> <field> <value> [field2] [value2] ...');
      process.exit(1);
    }

    const id = args[0];
    const updates: any = {};

    for (let i = 1; i < args.length; i += 2) {
      const field = args[i];
      const value = args[i + 1];
      
      if (field === 'rating') {
        updates.rating = parseInt(value, 10);
      } else if (field === 'notes') {
        updates.notes = value;
      } else if (field === 'date') {
        updates.date = value;
      }
    }

    await this.storageService.initialize();
    const updated = await this.storageService.updateMoodEntry(id, updates);
    console.log('Mood entry updated:', JSON.stringify(updated, null, 2));
  }

  /**
   * Handle delete command
   */
  private async handleDelete(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.error('Usage: delete <id>');
      process.exit(1);
    }

    const id = args[0];
    await this.storageService.initialize();
    await this.storageService.deleteMoodEntry(id);
    console.log('Mood entry deleted successfully');
  }

  /**
   * Handle sync command
   */
  private async handleSync(): Promise<void> {
    await this.storageService.initialize();
    const result = await this.storageService.syncData();
    console.log('Sync result:', JSON.stringify(result, null, 2));
  }

  /**
   * Handle stats command
   */
  private async handleStats(): Promise<void> {
    await this.storageService.initialize();
    const stats = await this.storageService.getStats();
    console.log('Storage stats:', JSON.stringify(stats, null, 2));
  }

  /**
   * Handle export command
   */
  private async handleExport(args: string[]): Promise<void> {
    const filename = args[0] || `moodtracker-export-${new Date().toISOString().split('T')[0]}.json`;
    
    await this.storageService.initialize();
    const data = await this.storageService.exportData();
    
    // In a real implementation, this would write to a file
    console.log(`Export data (would save to ${filename}):`);
    console.log(JSON.stringify(data, null, 2));
  }

  /**
   * Handle import command
   */
  private async handleImport(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.error('Usage: import <filename>');
      process.exit(1);
    }

    const filename = args[0];
    console.log(`Import from ${filename} not implemented in CLI mode`);
    console.log('Use JSON mode with stdin to import data');
  }

  /**
   * Handle health command
   */
  private async handleHealth(): Promise<void> {
    await this.storageService.initialize();
    const health = this.storageService.getHealthStatus();
    console.log('Health status:', JSON.stringify(health, null, 2));
  }

  /**
   * Print help information
   */
  private printHelp(): void {
    console.log(`
Mood Tracker Storage CLI

Usage:
  mood-storage [command] [options]

Commands:
  init                    Initialize storage service
  create <rating> <date> [notes]  Create a new mood entry
  get [options]           Get mood entries
  update <id> <field> <value>     Update a mood entry
  delete <id>             Delete a mood entry
  sync                    Sync data between local and cloud
  stats                   Show storage statistics
  export [filename]       Export all data
  import <filename>       Import data from file
  health                  Show health status

Options for 'get':
  --start-date <date>     Filter by start date (YYYY-MM-DD)
  --end-date <date>       Filter by end date (YYYY-MM-DD)
  --limit <number>        Limit number of results
  --offset <number>       Skip number of results

JSON Mode:
  Use --json flag for programmatic access via stdin/stdout
  Input: JSON command object
  Output: JSON response object

Examples:
  mood-storage create 8 2024-01-15 "Feeling great today!"
  mood-storage get --start-date 2024-01-01 --limit 10
  mood-storage update abc123 rating 9
  mood-storage sync
  mood-storage stats

JSON Examples:
  echo '{"command":"create","data":{"rating":8,"date":"2024-01-15","notes":"Great day!"}}' | mood-storage --json
  echo '{"command":"get","data":{"limit":5}}' | mood-storage --json
`);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new StorageCLI();
  cli.run().catch((error) => {
    console.error('CLI failed:', error);
    process.exit(1);
  });
}

export { StorageCLI };
