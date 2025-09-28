#!/usr/bin/env node
/**
 * CLI interface for @moodtracker/core library
 * Implements CLI with --json mode, stdin/stdout support (CLI Interface Gate)
 * Input via stdin, output via stdout, errors via stderr
 */

import { MoodService } from './services/MoodService';
import { TrendService } from './services/TrendService';
import { LocalStorageService } from '../mood-storage/services/LocalStorageService';
import { TimePeriod } from './models';
import { getLibraryInfo } from './index';

interface CLIResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): Record<string, any> {
  const parsed: Record<string, any> = {
    _: [] as string[],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('--')) {
        parsed[key] = nextArg;
        i++;
      } else {
        parsed[key] = true;
      }
    } else {
      parsed._.push(arg);
    }
  }

  return parsed;
}

/**
 * Format output based on --json flag
 */
function formatOutput(data: any, isJson: boolean): string {
  if (isJson) {
    return JSON.stringify(data);
  }

  // Text format - special handling for library info
  if (data && data.name === '@moodtracker/core' && data.version) {
    return `Library: ${data.name}\nVersion: ${data.version}\nDescription: ${data.description}\n\nServices:\n${data.services.join('\n- ')}\n\nModels:\n${data.models.join('\n- ')}`;
  }
  
  // General text format
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
      .join('\n');
  }

  return String(data);
}

/**
 * Create success response
 */
function successResponse(data: any): CLIResponse {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create error response
 */
function errorResponse(code: string, message: string): CLIResponse {
  return {
    success: false,
    error: { code, message },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Show help message
 */
function showHelp(isJson: boolean): void {
  const help = {
    name: '@moodtracker/core CLI',
    version: '1.0.0',
    description: 'Command-line interface for mood tracking core library',
    usage: 'mood-core [command] [options]',
    commands: {
      'info': 'Show library information',
      'mood create': 'Create a new mood entry',
      'mood get': 'Get a mood entry by ID',
      'mood update': 'Update an existing mood entry',
      'mood delete': 'Delete a mood entry',
      'mood list': 'List mood entries for a date range',
      'trend calculate': 'Calculate mood trend for a period',
    },
    options: {
      '--json': 'Output in JSON format',
      '--stdin': 'Read input from stdin',
      '--help': 'Show this help message',
      '--user': 'User ID (required for most commands)',
      '--rating': 'Mood rating (1-10)',
      '--notes': 'Optional notes',
      '--date': 'Date in YYYY-MM-DD format',
      '--id': 'Entry ID',
      '--period': 'Time period (week, month, quarter, year)',
      '--start-date': 'Start date for range queries',
      '--end-date': 'End date for range queries',
    },
  };

  if (isJson) {
    console.log(JSON.stringify(help));
  } else {
    console.log('@moodtracker/core CLI');
    console.log('Version: 1.0.0');
    console.log('\nUsage: mood-core [command] [options]\n');
    console.log('Commands:');
    Object.entries(help.commands).forEach(([cmd, desc]) => {
      console.log(`  ${cmd.padEnd(20)} ${desc}`);
    });
    console.log('\nOptions:');
    Object.entries(help.options).forEach(([opt, desc]) => {
      console.log(`  ${opt.padEnd(20)} ${desc}`);
    });
  }
}

/**
 * Process stdin input
 */
async function processStdin(
  input: string,
  isJson: boolean,
  services?: { moodService?: MoodService; trendService?: TrendService }
): Promise<void> {
  try {
    const data = JSON.parse(input);
    const { command, params } = data;

    if (!command) {
      throw new Error('Missing command in input');
    }

    // Convert dot notation to command array
    const commandParts = command.split('.');
    const args = [...commandParts];

    // Add parameters as flags
    Object.entries(params || {}).forEach(([key, value]) => {
      args.push(`--${key}`, String(value));
    });

    if (isJson) {
      args.push('--json');
    }

    // Process command
    await processCommand(args, isJson, services);
  } catch (error: unknown) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    }
    const response = errorResponse('PARSE_ERROR', `Invalid JSON input: ${message}`);
    console.error(formatOutput(response, isJson));
  }
}

/**
 * Process command
 */
async function processCommand(
  args: string[],
  isJson: boolean,
  services?: { moodService?: MoodService; trendService?: TrendService }
): Promise<void> {
  const parsed = parseArgs(args);
  const commands = parsed._;

  // Initialize services
  const storageService = new LocalStorageService();
  const moodService = services?.moodService || new MoodService(storageService);
  const trendService = services?.trendService || new TrendService(storageService);

  try {
    // Handle commands
    if (commands.length === 0 || parsed.help) {
      showHelp(isJson);
      return;
    }

    if (commands[0] === 'info') {
      const info = getLibraryInfo();
      console.log(formatOutput(info, isJson));
      return;
    }

    if (commands[0] === 'mood') {
      await handleMoodCommands(commands.slice(1), parsed, moodService, isJson);
      return;
    }

    if (commands[0] === 'trend') {
      await handleTrendCommands(commands.slice(1), parsed, trendService, isJson);
      return;
    }

    throw new Error(`Unknown command: ${commands[0]}`);
  } catch (error) {
    const response = errorResponse('COMMAND_ERROR', error instanceof Error ? error.message : 'Unknown error');
    console.error(formatOutput(response, isJson));
  }
}

/**
 * Handle mood-related commands
 */
async function handleMoodCommands(
  subcommands: string[],
  params: Record<string, any>,
  moodService: MoodService,
  isJson: boolean
): Promise<void> {
  const subcommand = subcommands[0];

  switch (subcommand) {
    case 'create': {
      if (!params.user) {
        throw new Error('Missing required parameter: user');
      }
      if (!params.rating) {
        throw new Error('Missing required parameter: rating');
      }

      const rating = parseInt(params.rating, 10);
      const result = await moodService.createMoodEntry(
        params.user,
        rating,
        params.notes,
        params.date
      );

      const response = successResponse(result);
      console.log(formatOutput(response, isJson));
      break;
    }

    case 'get': {
      if (!params.id) {
        throw new Error('Missing required parameter: id');
      }

      const result = await moodService.getMoodEntry(params.id);
      
      if (!result) {
        throw new Error('Mood entry not found');
      }

      const response = successResponse(result);
      console.log(formatOutput(response, isJson));
      break;
    }

    case 'update': {
      if (!params.id) {
        throw new Error('Missing required parameter: id');
      }

      const updates: any = {};
      if (params.rating) {
        updates.rating = parseInt(params.rating, 10);
      }
      if (params.notes !== undefined) {
        updates.notes = params.notes;
      }

      const result = await moodService.updateMoodEntry(params.id, updates);
      const response = successResponse(result);
      console.log(formatOutput(response, isJson));
      break;
    }

    case 'delete': {
      if (!params.id) {
        throw new Error('Missing required parameter: id');
      }

      const result = await moodService.deleteMoodEntry(params.id);
      const response = successResponse({ deleted: result });
      console.log(formatOutput(response, isJson));
      break;
    }

    case 'list': {
      if (!params.user) {
        throw new Error('Missing required parameter: user');
      }
      if (!params['start-date'] || !params['end-date']) {
        throw new Error('Missing required parameters: start-date and end-date');
      }

      const result = await moodService.getMoodEntriesByDateRange(
        params.user,
        params['start-date'],
        params['end-date']
      );

      const response = successResponse(result);
      console.log(formatOutput(response, isJson));
      break;
    }

    default:
      throw new Error(`Unknown mood subcommand: ${subcommand}`);
  }
}

/**
 * Handle trend-related commands
 */
async function handleTrendCommands(
  subcommands: string[],
  params: Record<string, any>,
  trendService: TrendService,
  isJson: boolean
): Promise<void> {
  const subcommand = subcommands[0];

  switch (subcommand) {
    case 'calculate': {
      if (!params.user) {
        throw new Error('Missing required parameter: user');
      }
      if (!params.period) {
        throw new Error('Missing required parameter: period');
      }

      // Validate period
      const validPeriods = Object.values(TimePeriod);
      if (!validPeriods.includes(params.period as TimePeriod)) {
        throw new Error(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
      }

      const result = await trendService.calculateTrend(
        params.user,
        params.period as TimePeriod
      );

      const response = successResponse(result);
      console.log(formatOutput(response, isJson));
      break;
    }

    default:
      throw new Error(`Unknown trend subcommand: ${subcommand}`);
  }
}

/**
 * Main CLI runner
 */
export async function runCLI(
  args: string[],
  stdinData?: string,
  services?: { moodService?: MoodService; trendService?: TrendService }
): Promise<void> {
  const parsed = parseArgs(args);
  const isJson = parsed.json === true;

  try {
    if (parsed.stdin && stdinData) {
      await processStdin(stdinData, isJson, services);
    } else {
      await processCommand(args, isJson, services);
    }
  } catch (error) {
    const response = errorResponse('CLI_ERROR', error instanceof Error ? error.message : 'Unknown error');
    console.error(formatOutput(response, isJson));
    process.exit(1);
  }
}

// Run CLI if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--stdin')) {
    let input = '';
    process.stdin.on('data', (chunk) => {
      input += chunk;
    });
    process.stdin.on('end', () => {
      runCLI(args, input.trim());
    });
  } else {
    runCLI(args);
  }
}
