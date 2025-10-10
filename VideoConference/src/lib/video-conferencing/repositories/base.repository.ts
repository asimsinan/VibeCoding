import { DatabaseService } from '../services/database.service';

export interface RepositoryOptions {
  tableName: string;
  primaryKey: string;
}

export abstract class BaseRepository<T, CreateT, UpdateT> {
  protected databaseService: DatabaseService;
  protected tableName: string;
  protected primaryKey: string;

  constructor(databaseService: DatabaseService, options: RepositoryOptions) {
    this.databaseService = databaseService;
    this.tableName = options.tableName;
    this.primaryKey = options.primaryKey;
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    const supabase = this.databaseService.getSupabaseClient();
    const { data, error } = await (supabase as any)
      .from(this.tableName)
      .select('*')
      .eq(this.primaryKey, id)
      .single();
    
    if (error || !data) {
      return null;
    }

    return this.mapRowToEntity(data);
  }

  /**
   * Find all entities with optional conditions
   */
  async findAll(conditions?: Record<string, any>, orderBy?: string, limit?: number, offset?: number): Promise<T[]> {
    const supabase = this.databaseService.getSupabaseClient();
    let query = (supabase as any).from(this.tableName).select('*');

    if (conditions && Object.keys(conditions).length > 0) {
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (orderBy) {
      const [column, direction] = orderBy.split(' ');
      query = query.order(column, { ascending: direction !== 'DESC' });
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 1000) - 1);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data || []).map((row: any) => this.mapRowToEntity(row));
  }

  /**
   * Create new entity
   */
  async create(data: CreateT): Promise<T> {
    const entityData = this.mapCreateDataToEntity(data);
    const supabase = this.databaseService.getSupabaseClient();
    
    const { data: result, error } = await (supabase as any)
      .from(this.tableName)
      .insert(entityData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.mapRowToEntity(result);
  }

  /**
   * Update entity by ID
   */
  async update(id: string, data: UpdateT): Promise<T | null> {
    const updateData = this.mapUpdateDataToEntity(data);
    const supabase = this.databaseService.getSupabaseClient();
    
    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const { data: result, error } = await (supabase as any)
      .from(this.tableName)
      .update(updateData)
      .eq(this.primaryKey, id)
      .select()
      .single();

    if (error || !result) {
      return null;
    }

    return this.mapRowToEntity(result);
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<boolean> {
    const supabase = this.databaseService.getSupabaseClient();
    const { error } = await (supabase as any)
      .from(this.tableName)
      .delete()
      .eq(this.primaryKey, id);

    return !error;
  }

  /**
   * Count entities with optional conditions
   */
  async count(conditions?: Record<string, any>): Promise<number> {
    const supabase = this.databaseService.getSupabaseClient();
    let query = (supabase as any).from(this.tableName).select('*', { count: 'exact', head: true });

    if (conditions && Object.keys(conditions).length > 0) {
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { count, error } = await query;
    if (error) {
      throw error;
    }

    return count || 0;
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    const supabase = this.databaseService.getSupabaseClient();
    const { data, error } = await (supabase as any)
      .from(this.tableName)
      .select('1')
      .eq(this.primaryKey, id)
      .limit(1);

    return !error && data && data.length > 0;
  }

  /**
   * Find one entity with conditions
   */
  async findOne(conditions: Record<string, any>): Promise<T | null> {
    const supabase = this.databaseService.getSupabaseClient();
    let query = (supabase as any).from(this.tableName).select('*');

    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.limit(1);
    
    if (error || !data || data.length === 0) {
      return null;
    }

    return this.mapRowToEntity(data[0]);
  }

  /**
   * Execute raw query (deprecated - use direct Supabase calls)
   * @deprecated Use direct Supabase client calls instead
   */
  async query(_sql: string, _params: any[] = []): Promise<any[]> {
    console.warn('BaseRepository.query() is deprecated. Use direct Supabase client calls instead.');
    throw new Error('Raw SQL queries are not supported. Use direct Supabase client calls.');
  }

  /**
   * Begin transaction (not supported with Supabase)
   * @deprecated Supabase handles transactions automatically
   */
  async beginTransaction(): Promise<void> {
    console.warn('BaseRepository.beginTransaction() is deprecated. Supabase handles transactions automatically.');
  }

  /**
   * Commit transaction (not supported with Supabase)
   * @deprecated Supabase handles transactions automatically
   */
  async commitTransaction(): Promise<void> {
    console.warn('BaseRepository.commitTransaction() is deprecated. Supabase handles transactions automatically.');
  }

  /**
   * Rollback transaction (not supported with Supabase)
   * @deprecated Supabase handles transactions automatically
   */
  async rollbackTransaction(): Promise<void> {
    console.warn('BaseRepository.rollbackTransaction() is deprecated. Supabase handles transactions automatically.');
  }

  /**
   * Map database row to entity
   */
  protected abstract mapRowToEntity(row: any): T;

  /**
   * Map create data to entity data
   */
  protected abstract mapCreateDataToEntity(data: CreateT): Record<string, any>;

  /**
   * Map update data to entity data
   */
  protected abstract mapUpdateDataToEntity(data: UpdateT): Record<string, any>;
}
