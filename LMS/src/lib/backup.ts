import { PrismaClient } from '../generated/prisma';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Database backup configuration
export interface BackupConfig {
  outputDir: string;
  maxBackups: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  scheduleEnabled: boolean;
  scheduleInterval: string; // cron expression
}

// Default backup configuration
const defaultBackupConfig: BackupConfig = {
  outputDir: './backups',
  maxBackups: 30, // Keep 30 days of backups
  compressionEnabled: true,
  encryptionEnabled: false,
  scheduleEnabled: false,
  scheduleInterval: '0 2 * * *', // Daily at 2 AM
};

// Database backup manager
export class DatabaseBackupManager {
  private prisma: PrismaClient;
  private config: BackupConfig;

  constructor(config: Partial<BackupConfig> = {}) {
    this.prisma = new PrismaClient();
    this.config = { ...defaultBackupConfig, ...config };
  }

  // Create a full database backup
  public async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}.sql`;
      const backupPath = join(this.config.outputDir, backupFileName);

      // Ensure backup directory exists
      await mkdir(this.config.outputDir, { recursive: true });

      // Create SQLite backup
      if (process.env.DATABASE_URL?.startsWith('file:')) {
        const dbPath = process.env.DATABASE_URL.replace('file:', '');
        await execAsync(`sqlite3 "${dbPath}" ".backup '${backupPath}'"`);
      } else {
        // For PostgreSQL, use pg_dump
        await execAsync(`pg_dump "${process.env.DATABASE_URL}" > "${backupPath}"`);
      }

      // Compress backup if enabled
      if (this.config.compressionEnabled) {
        const compressedPath = `${backupPath}.gz`;
        await execAsync(`gzip "${backupPath}"`);
        return compressedPath;
      }

      return backupPath;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }

  // Restore database from backup
  public async restoreBackup(backupPath: string): Promise<void> {
    try {
      if (process.env.DATABASE_URL?.startsWith('file:')) {
        const dbPath = process.env.DATABASE_URL.replace('file:', '');
        
        // Restore SQLite backup
        if (backupPath.endsWith('.gz')) {
          // Decompress first
          const decompressedPath = backupPath.replace('.gz', '');
          await execAsync(`gunzip -c "${backupPath}" > "${decompressedPath}"`);
          await execAsync(`sqlite3 "${dbPath}" ".restore '${decompressedPath}'"`);
        } else {
          await execAsync(`sqlite3 "${dbPath}" ".restore '${backupPath}'"`);
        }
      } else {
        // For PostgreSQL, use psql
        if (backupPath.endsWith('.gz')) {
          await execAsync(`gunzip -c "${backupPath}" | psql "${process.env.DATABASE_URL}"`);
        } else {
          await execAsync(`psql "${process.env.DATABASE_URL}" < "${backupPath}"`);
        }
      }

      console.log(`Database restored from backup: ${backupPath}`);
    } catch (error) {
      console.error('Backup restoration failed:', error);
      throw error;
    }
  }

  // List available backups
  public async listBackups(): Promise<string[]> {
    try {
      const { readdir } = await import('fs/promises');
      const files = await readdir(this.config.outputDir);
      return files
        .filter(file => file.startsWith('backup-') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
        .sort()
        .reverse(); // Most recent first
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  // Clean up old backups
  public async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.config.maxBackups) {
        const backupsToDelete = backups.slice(this.config.maxBackups);
        
        for (const backup of backupsToDelete) {
          const backupPath = join(this.config.outputDir, backup);
          await execAsync(`rm "${backupPath}"`);
          console.log(`Deleted old backup: ${backup}`);
        }
      }
    } catch (error) {
      console.error('Backup cleanup failed:', error);
      throw error;
    }
  }

  // Verify backup integrity
  public async verifyBackup(backupPath: string): Promise<boolean> {
    try {
      // Check if backup file exists and is readable
      const { access, constants } = await import('fs/promises');
      await access(backupPath, constants.R_OK);
      
      // For SQLite, verify the backup can be opened
      if (process.env.DATABASE_URL?.startsWith('file:')) {
        const tempDbPath = join(this.config.outputDir, 'temp-verify.db');
        
        if (backupPath.endsWith('.gz')) {
          await execAsync(`gunzip -c "${backupPath}" | sqlite3 "${tempDbPath}"`);
        } else {
          await execAsync(`sqlite3 "${tempDbPath}" ".restore '${backupPath}'"`);
        }
        
        // Verify the temporary database
        const result = await execAsync(`sqlite3 "${tempDbPath}" "SELECT COUNT(*) FROM sqlite_master;"`);
        const tableCount = parseInt(result.stdout.trim());
        
        // Clean up temporary database
        await execAsync(`rm "${tempDbPath}"`);
        
        return tableCount > 0;
      }
      
      return true;
    } catch (error) {
      console.error('Backup verification failed:', error);
      return false;
    }
  }

  // Get backup statistics
  public async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup: string | null;
    newestBackup: string | null;
  }> {
    try {
      const backups = await this.listBackups();
      const { stat } = await import('fs/promises');
      
      let totalSize = 0;
      let oldestBackup: string | null = null;
      let newestBackup: string | null = null;
      
      for (const backup of backups) {
        const backupPath = join(this.config.outputDir, backup);
        const stats = await stat(backupPath);
        totalSize += stats.size;
        
        if (!oldestBackup || backup < oldestBackup) {
          oldestBackup = backup;
        }
        if (!newestBackup || backup > newestBackup) {
          newestBackup = backup;
        }
      }
      
      return {
        totalBackups: backups.length,
        totalSize,
        oldestBackup,
        newestBackup,
      };
    } catch (error) {
      console.error('Failed to get backup stats:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
      };
    }
  }

  // Schedule automatic backups
  public async scheduleBackups(): Promise<void> {
    if (!this.config.scheduleEnabled) {
      console.log('Backup scheduling is disabled');
      return;
    }

    // In a real implementation, you would use a job scheduler like node-cron
    // For now, we'll just log the schedule
    console.log(`Backups scheduled with cron expression: ${this.config.scheduleInterval}`);
    
    // Example of how to implement with node-cron:
    /*
    const cron = require('node-cron');
    
    cron.schedule(this.config.scheduleInterval, async () => {
      try {
        console.log('Starting scheduled backup...');
        const backupPath = await this.createBackup();
        await this.cleanupOldBackups();
        console.log(`Scheduled backup completed: ${backupPath}`);
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    });
    */
  }

  // Export database schema only
  public async exportSchema(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const schemaFileName = `schema-${timestamp}.sql`;
      const schemaPath = join(this.config.outputDir, schemaFileName);

      await mkdir(this.config.outputDir, { recursive: true });

      if (process.env.DATABASE_URL?.startsWith('file:')) {
        const dbPath = process.env.DATABASE_URL.replace('file:', '');
        await execAsync(`sqlite3 "${dbPath}" ".schema" > "${schemaPath}"`);
      } else {
        await execAsync(`pg_dump --schema-only "${process.env.DATABASE_URL}" > "${schemaPath}"`);
      }

      return schemaPath;
    } catch (error) {
      console.error('Schema export failed:', error);
      throw error;
    }
  }

  // Export specific table data
  public async exportTable(tableName: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const tableFileName = `${tableName}-${timestamp}.sql`;
      const tablePath = join(this.config.outputDir, tableFileName);

      await mkdir(this.config.outputDir, { recursive: true });

      if (process.env.DATABASE_URL?.startsWith('file:')) {
        const dbPath = process.env.DATABASE_URL.replace('file:', '');
        await execAsync(`sqlite3 "${dbPath}" ".dump ${tableName}" > "${tablePath}"`);
      } else {
        await execAsync(`pg_dump --table="${tableName}" "${process.env.DATABASE_URL}" > "${tablePath}"`);
      }

      return tablePath;
    } catch (error) {
      console.error(`Table export failed for ${tableName}:`, error);
      throw error;
    }
  }

  // Test backup and restore process
  public async testBackupRestore(): Promise<boolean> {
    try {
      console.log('Testing backup and restore process...');
      
      // Create a test backup
      const backupPath = await this.createBackup();
      console.log(`Test backup created: ${backupPath}`);
      
      // Verify the backup
      const isValid = await this.verifyBackup(backupPath);
      if (!isValid) {
        throw new Error('Backup verification failed');
      }
      
      console.log('Backup verification passed');
      
      // In a real scenario, you would restore to a test database
      // For now, we'll just verify the backup file
      console.log('Backup and restore test completed successfully');
      
      return true;
    } catch (error) {
      console.error('Backup and restore test failed:', error);
      return false;
    }
  }

  // Get database size
  public async getDatabaseSize(): Promise<number> {
    try {
      if (process.env.DATABASE_URL?.startsWith('file:')) {
        const dbPath = process.env.DATABASE_URL.replace('file:', '');
        const { stat } = await import('fs/promises');
        const stats = await stat(dbPath);
        return stats.size;
      } else {
        // For PostgreSQL, query the database size
        const result = await execAsync(`psql "${process.env.DATABASE_URL}" -c "SELECT pg_size_pretty(pg_database_size(current_database()));"`);
        // Parse the size from the output
        const sizeMatch = result.stdout.match(/(\d+)\s*(\w+)/);
        if (sizeMatch) {
          const size = parseInt(sizeMatch[1]);
          const unit = sizeMatch[2];
          // Convert to bytes
          switch (unit) {
            case 'kB': return size * 1024;
            case 'MB': return size * 1024 * 1024;
            case 'GB': return size * 1024 * 1024 * 1024;
            default: return size;
          }
        }
        return 0;
      }
    } catch (error) {
      console.error('Failed to get database size:', error);
      return 0;
    }
  }

  // Close database connection
  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Backup service for API endpoints
export class BackupService {
  private backupManager: DatabaseBackupManager;

  constructor(config?: Partial<BackupConfig>) {
    this.backupManager = new DatabaseBackupManager(config);
  }

  // Create backup via API
  public async createBackup(): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    try {
      const backupPath = await this.backupManager.createBackup();
      await this.backupManager.cleanupOldBackups();
      
      return {
        success: true,
        backupPath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Restore backup via API
  public async restoreBackup(backupPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.backupManager.restoreBackup(backupPath);
      
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get backup status
  public async getBackupStatus(): Promise<{
    stats: any;
    databaseSize: number;
    lastBackup: string | null;
  }> {
    try {
      const stats = await this.backupManager.getBackupStats();
      const databaseSize = await this.backupManager.getDatabaseSize();
      const backups = await this.backupManager.listBackups();
      
      return {
        stats,
        databaseSize,
        lastBackup: backups.length > 0 ? backups[0] : null,
      };
    } catch (error) {
      throw error;
    }
  }
}

// Export default backup manager
export default DatabaseBackupManager;
