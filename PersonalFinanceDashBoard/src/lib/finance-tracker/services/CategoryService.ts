import { Knex } from 'knex'; // Import Knex for type hinting
import { Category } from '../models';

interface CategoryFilter {
  userId: string;
  type?: 'expense' | 'income';
}

export class CategoryService {
  private static readonly TABLE_NAME = 'categories';
  private knex: Knex;

  constructor(knexInstance: Knex) {
    this.knex = knexInstance;
  }

  public async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>, trx?: Knex.Transaction): Promise<Category> {
    const dbCategory = {
      user_id: category.userId,
      name: category.name,
      type: category.type
    };
    const [newCategory] = await (trx || this.knex)(CategoryService.TABLE_NAME).insert(dbCategory).returning('*');
    return {
      id: newCategory.id,
      userId: newCategory.user_id,
      name: newCategory.name,
      type: newCategory.type,
      createdAt: newCategory.created_at,
      updatedAt: newCategory.updated_at
    };
  }

  public async getCategories(filters: CategoryFilter, trx?: Knex.Transaction): Promise<Category[]> {
    const { userId, type } = filters;

    const query = (trx || this.knex)(CategoryService.TABLE_NAME)
      .where({ user_id: userId })
      .orderBy('name', 'asc');

    if (type) {
      query.andWhere({ type });
    }

    const results = await query;
    return results.map(category => ({
      id: category.id,
      userId: category.user_id,
      name: category.name,
      type: category.type,
      createdAt: category.created_at,
      updatedAt: category.updated_at
    }));
  }

  public async getCategoryById(id: string, userId: string, trx?: Knex.Transaction): Promise<Category | undefined> {
    const result = await (trx || this.knex)(CategoryService.TABLE_NAME).where({ id, user_id: userId }).first();
    if (!result) return undefined;
    return {
      id: result.id,
      userId: result.user_id,
      name: result.name,
      type: result.type,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  public async updateCategory(id: string, userId: string, updates: Partial<Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>, trx?: Knex.Transaction): Promise<Category | undefined> {
    const [updatedCategory] = await (trx || this.knex)(CategoryService.TABLE_NAME)
      .where({ id, user_id: userId })
      .update(updates)
      .returning('*');
    if (!updatedCategory) return undefined;
    return {
      id: updatedCategory.id,
      userId: updatedCategory.user_id,
      name: updatedCategory.name,
      type: updatedCategory.type,
      createdAt: updatedCategory.created_at,
      updatedAt: updatedCategory.updated_at
    };
  }

  public async deleteCategory(id: string, userId: string, trx?: Knex.Transaction): Promise<boolean> {
    const deletedCount = await (trx || this.knex)(CategoryService.TABLE_NAME).where({ id, user_id: userId }).del();
    return deletedCount > 0;
  }
}
