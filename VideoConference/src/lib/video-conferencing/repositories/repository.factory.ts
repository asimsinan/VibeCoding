import { DatabaseService } from '../services/database.service';
import { ParticipantRepository } from './participant.repository';

export class RepositoryFactory {
  private databaseService: DatabaseService;
  private participantRepository: ParticipantRepository | null = null;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  /**
   * Get participant repository instance
   */
  getParticipantRepository(): ParticipantRepository {
    if (!this.participantRepository) {
      this.participantRepository = new ParticipantRepository(this.databaseService);
    }
    return this.participantRepository;
  }

  /**
   * Get all repositories
   */
  getAllRepositories() {
    return {
      participant: this.getParticipantRepository()
    };
  }

  /**
   * Clear all repository instances (useful for testing)
   */
  clearRepositories(): void {
    this.participantRepository = null;
  }

  /**
   * Check if database service is connected
   */
  async isConnected(): Promise<boolean> {
    return this.databaseService.isConnected();
  }

  /**
   * Initialize repositories (ensure database connection)
   */
  async initialize(): Promise<void> {
    if (!this.databaseService.isConnected()) {
      await this.databaseService.initialize();
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    this.clearRepositories();
  }
}
