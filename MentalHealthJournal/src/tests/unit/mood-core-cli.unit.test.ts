/**
 * Unit tests for @moodtracker/core CLI interface
 * Tests CLI functionality with --json mode
 * Traces to CLI Interface Gate
 */

import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { runCLI } from '../../lib/mood-core/cli';
import { MoodService } from '../../lib/mood-core/services/MoodService';
import { TrendService } from '../../lib/mood-core/services/TrendService';
import { TimePeriod } from '../../lib/mood-core/models';

// Mock services
jest.mock('../../lib/mood-core/services/MoodService');
jest.mock('../../lib/mood-core/services/TrendService');
jest.mock('../../lib/mood-storage/services/LocalStorageService');

describe('@moodtracker/core CLI', () => {
  let mockMoodService: jest.Mocked<MoodService>;
  let mockTrendService: jest.Mocked<TrendService>;
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let consoleOutput: string[] = [];
  let consoleErrors: string[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    consoleOutput = [];
    consoleErrors = [];
    
    // Mock console methods
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
    });
    console.error = jest.fn((...args) => {
      consoleErrors.push(args.join(' '));
    });

    // Create mocked services
    mockMoodService = {
      createMoodEntry: jest.fn(),
      getMoodEntry: jest.fn(),
      updateMoodEntry: jest.fn(),
      deleteMoodEntry: jest.fn(),
      getMoodEntriesByDateRange: jest.fn(),
      getAllMoodEntries: jest.fn(),
    } as any;

    mockTrendService = {
      calculateTrend: jest.fn(),
    } as any;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Help command', () => {
    test('should show help when no arguments provided', async () => {
      await runCLI([], undefined, { moodService: mockMoodService, trendService: mockTrendService });
      
      expect(consoleOutput.join('\n')).toContain('@moodtracker/core CLI');
      expect(consoleOutput.join('\n')).toContain('Usage:');
      expect(consoleOutput.join('\n')).toContain('Commands:');
    });

    test('should show help with --help flag', async () => {
      await runCLI(['--help'], undefined, { moodService: mockMoodService, trendService: mockTrendService });
      
      expect(consoleOutput.join('\n')).toContain('@moodtracker/core CLI');
      expect(consoleOutput.join('\n')).toContain('Usage:');
    });
  });

  describe('Library info command', () => {
    test('should show library info in JSON format', async () => {
      await runCLI(['info', '--json'], undefined, { moodService: mockMoodService, trendService: mockTrendService });
      
      const output = JSON.parse(consoleOutput[0]);
      expect(output.name).toBe('@moodtracker/core');
      expect(output.version).toBe('1.0.0');
      expect(output.services).toContain('MoodService');
      expect(output.services).toContain('TrendService');
    });

    test('should show library info in text format', async () => {
      await runCLI(['info'], undefined, { moodService: mockMoodService, trendService: mockTrendService });
      
      expect(consoleOutput.join('\n')).toContain('@moodtracker/core');
      expect(consoleOutput.join('\n')).toContain('Version: 1.0.0');
    });
  });

  describe('Create mood entry command', () => {
    test('should create mood entry with valid input', async () => {
      const mockEntry = {
        id: 'test-id',
        userId: 'user-123',
        rating: 7,
        notes: 'Good day',
        date: '2025-01-28',
        createdAt: '2025-01-28T10:00:00Z',
        updatedAt: '2025-01-28T10:00:00Z',
        status: 'active',
      };

      mockMoodService.createMoodEntry.mockResolvedValue(mockEntry as any);

      await runCLI([
        'mood',
        'create',
        '--user', 'user-123',
        '--rating', '7',
        '--notes', 'Good day',
        '--date', '2025-01-28',
        '--json'
      ], undefined, { moodService: mockMoodService, trendService: mockTrendService });

      expect(mockMoodService.createMoodEntry).toHaveBeenCalledWith(
        'user-123',
        7,
        'Good day',
        '2025-01-28'
      );

      const output = JSON.parse(consoleOutput[0]);
      expect(output.success).toBe(true);
      expect(output.data).toEqual(mockEntry);
    });

    test('should handle missing required parameters', async () => {
      await runCLI([
        'mood',
        'create',
        '--rating', '7',
        '--json'
      ], undefined, { moodService: mockMoodService, trendService: mockTrendService });

      const output = JSON.parse(consoleErrors[0]);
      expect(output.success).toBe(false);
      expect(output.error.message).toContain('Missing required parameter: user');
    });

    test('should handle service errors', async () => {
      mockMoodService.createMoodEntry.mockRejectedValue(
        new Error('Rating must be between 1 and 10')
      );

      await runCLI([
        'mood',
        'create',
        '--user', 'user-123',
        '--rating', '15',
        '--json'
      ], undefined, { moodService: mockMoodService, trendService: mockTrendService });

      const output = JSON.parse(consoleErrors[0]);
      expect(output.success).toBe(false);
      expect(output.error.message).toBe('Rating must be between 1 and 10');
    });
  });

  describe('Get mood entry command', () => {
    test('should get mood entry by ID', async () => {
      const mockEntry = {
        id: 'test-id',
        userId: 'user-123',
        rating: 7,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:00:00Z',
        updatedAt: '2025-01-28T10:00:00Z',
        status: 'active',
      };

      mockMoodService.getMoodEntry.mockResolvedValue(mockEntry as any);

      await runCLI(['mood', 'get', '--id', 'test-id', '--json'], undefined, { moodService: mockMoodService, trendService: mockTrendService });

      expect(mockMoodService.getMoodEntry).toHaveBeenCalledWith('test-id');

      const output = JSON.parse(consoleOutput[0]);
      expect(output.success).toBe(true);
      expect(output.data).toEqual(mockEntry);
    });

    test('should handle not found', async () => {
      mockMoodService.getMoodEntry.mockResolvedValue(null);

      await runCLI(['mood', 'get', '--id', 'non-existent', '--json'], undefined, { moodService: mockMoodService, trendService: mockTrendService });

      const output = JSON.parse(consoleErrors[0]);
      expect(output.success).toBe(false);
      expect(output.error.message).toBe('Mood entry not found');
    });
  });

  describe('Calculate trend command', () => {
    test('should calculate trend for period', async () => {
      const mockTrend = {
        id: 'trend-id',
        userId: 'user-123',
        period: TimePeriod.Week,
        startDate: '2025-01-22',
        endDate: '2025-01-28',
        statistics: {
          averageMood: 7,
          lowestMood: 5,
          highestMood: 9,
          totalEntries: 5,
          completionRate: 0.71,
          trendDirection: 'stable',
        },
        dataPoints: [],
        insights: ['Your mood has been stable'],
        createdAt: '2025-01-28T10:00:00Z',
      };

      mockTrendService.calculateTrend.mockResolvedValue(mockTrend as any);

      await runCLI([
        'trend',
        'calculate',
        '--user', 'user-123',
        '--period', 'week',
        '--json'
      ], undefined, { moodService: mockMoodService, trendService: mockTrendService });

      expect(mockTrendService.calculateTrend).toHaveBeenCalledWith(
        'user-123',
        TimePeriod.Week
      );

      const output = JSON.parse(consoleOutput[0]);
      expect(output.success).toBe(true);
      expect(output.data).toEqual(mockTrend);
    });

    test('should handle invalid period', async () => {
      await runCLI([
        'trend',
        'calculate',
        '--user', 'user-123',
        '--period', 'invalid',
        '--json'
      ], undefined, { moodService: mockMoodService, trendService: mockTrendService });

      const output = JSON.parse(consoleErrors[0]);
      expect(output.success).toBe(false);
      expect(output.error.message).toContain('Invalid period');
    });
  });

  describe('Standard input mode', () => {
    test('should accept JSON input from stdin', async () => {
      const mockEntry = {
        id: 'test-id',
        userId: 'user-123',
        rating: 8,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:00:00Z',
        updatedAt: '2025-01-28T10:00:00Z',
        status: 'active',
      };

      mockMoodService.createMoodEntry.mockResolvedValue(mockEntry as any);

      const stdinData = JSON.stringify({
        command: 'mood.create',
        params: {
          user: 'user-123',
          rating: 8,
          date: '2025-01-28'
        }
      });

      // Simulate stdin input
      await runCLI(['--stdin', '--json'], stdinData, { moodService: mockMoodService, trendService: mockTrendService });

      expect(mockMoodService.createMoodEntry).toHaveBeenCalledWith(
        'user-123',
        8,
        undefined,
        '2025-01-28'
      );

      const output = JSON.parse(consoleOutput[0]);
      expect(output.success).toBe(true);
    });

    test('should handle invalid JSON from stdin', async () => {
      await runCLI(['--stdin', '--json'], 'invalid json', { moodService: mockMoodService, trendService: mockTrendService });

      const output = JSON.parse(consoleErrors[0]);
      expect(output.success).toBe(false);
      expect(output.error.message).toContain('Invalid JSON input');
    });
  });

  describe('Error handling', () => {
    test('should handle unknown commands', async () => {
      await runCLI(['unknown', 'command', '--json'], undefined, { moodService: mockMoodService, trendService: mockTrendService });

      const output = JSON.parse(consoleErrors[0]);
      expect(output.success).toBe(false);
      expect(output.error.message).toContain('Unknown command');
    });

    test('should output to stderr on error', async () => {
      mockMoodService.createMoodEntry.mockRejectedValue(new Error('Test error'));

      await runCLI([
        'mood',
        'create',
        '--user', 'user-123',
        '--rating', '7',
        '--json'
      ], undefined, { moodService: mockMoodService, trendService: mockTrendService });

      expect(consoleErrors.length).toBeGreaterThan(0);
      expect(consoleOutput.length).toBe(0);
    });
  });
});
