/**
 * @moodtracker/core - Core mood logging business logic library
 * Implements mood tracking functionality as a standalone library (Library-First Gate)
 * All features trace to functional requirements FR-001 through FR-007
 */

// Export models
export * from './models';

// Export services
export { MoodService } from './services/MoodService';
export { TrendService } from './services/TrendService';
export { ValidationService } from './services/ValidationService';

// Library metadata
export const LIBRARY_NAME = '@moodtracker/core';
export const LIBRARY_VERSION = '1.0.0';

// Library info function for CLI
export function getLibraryInfo() {
  return {
    name: LIBRARY_NAME,
    version: LIBRARY_VERSION,
    description: 'Core mood logging business logic library',
    services: ['MoodService', 'TrendService', 'ValidationService'],
    models: ['MoodEntry', 'MoodTrend', 'User', 'AppSettings'],
  };
}
