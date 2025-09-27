import { Knex } from 'knex'; // Import Knex for type hinting
import { Transaction } from '../models'; // Re-add this import

interface TransactionFilter {
  userId: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: 'expense' | 'income';
  limit?: number;
  offset?: number;
}

export class TransactionService {
  private static readonly TABLE_NAME = 'transactions';
  private knex: Knex;

  constructor(knexInstance: Knex) {
    this.knex = knexInstance;
  }

  public async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, trx?: Knex.Transaction): Promise<Transaction> {
    const dbTransaction = {
      user_id: transaction.userId,
      category_id: transaction.categoryId,
      amount: transaction.amount,
      type: transaction.type,
      date: transaction.date + 'T00:00:00.000Z', // Ensure UTC date string
      description: transaction.description
    };
    const [newTransaction] = await (trx || this.knex)(TransactionService.TABLE_NAME).insert(dbTransaction).returning('*');
    return {
      id: newTransaction.id,
      userId: newTransaction.user_id,
      categoryId: newTransaction.category_id,
      amount: parseFloat(newTransaction.amount),
      type: newTransaction.type,
      date: newTransaction.date instanceof Date ? newTransaction.date.toISOString().split('T')[0] : new Date(newTransaction.date).toISOString().split('T')[0], // Ensure date is string in YYYY-MM-DD format
      description: newTransaction.description,
      createdAt: newTransaction.created_at,
      updatedAt: newTransaction.updated_at
    };
  }

  public async getTransactions(filters: TransactionFilter, trx?: Knex.Transaction): Promise<Transaction[]> {
    const { userId, startDate, endDate, categoryId, type, limit, offset } = filters;

    const query = (trx || this.knex)(TransactionService.TABLE_NAME)
      .where({ user_id: userId })
      .orderBy('date', 'desc')
      .orderBy('created_at', 'desc');

    if (startDate) {
      query.andWhere('date', '>=', startDate);
    }
    if (endDate) {
      query.andWhere('date', '<=', endDate);
    }
    if (categoryId) {
      query.andWhere({ category_id: categoryId });
    }
    if (type) {
      query.andWhere({ type });
    }
    if (limit) {
      query.limit(limit);
    }
    if (offset) {
      query.offset(offset);
    }

    const results = await query;
    return results.map(transaction => ({
      id: transaction.id,
      userId: transaction.user_id,
      categoryId: transaction.category_id,
      amount: parseFloat(transaction.amount),
      type: transaction.type,
      date: transaction.date instanceof Date ? transaction.date.toISOString().split('T')[0] : new Date(transaction.date).toISOString().split('T')[0], // Ensure date is string in YYYY-MM-DD format
      description: transaction.description,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at
    }));
  }

  public async getTransactionById(id: string, userId: string, trx?: Knex.Transaction): Promise<Transaction | undefined> {
    const result = await (trx || this.knex)(TransactionService.TABLE_NAME).where({ id, user_id: userId }).first();
    if (!result) return undefined;
    return {
      id: result.id,
      userId: result.user_id,
      categoryId: result.category_id,
      amount: parseFloat(result.amount),
      type: result.type,
      date: result.date instanceof Date ? result.date.toISOString().split('T')[0] : new Date(result.date).toISOString().split('T')[0], // Ensure date is string in YYYY-MM-DD format
      description: result.description,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  public async updateTransaction(id: string, userId: string, updates: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>, trx?: Knex.Transaction): Promise<Transaction | undefined> {
    const dbUpdates: any = {};
    if (updates.categoryId) dbUpdates.category_id = updates.categoryId;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.type) dbUpdates.type = updates.type;
    if (updates.date) dbUpdates.date = updates.date; // Keep date as string (YYYY-MM-DD format)
    if (updates.description !== undefined) dbUpdates.description = updates.description;

    const [updatedTransaction] = await (trx || this.knex)(TransactionService.TABLE_NAME)
      .where({ id, user_id: userId })
      .update(dbUpdates)
      .returning('*');
    if (!updatedTransaction) return undefined;
    return {
      id: updatedTransaction.id,
      userId: updatedTransaction.user_id,
      categoryId: updatedTransaction.category_id,
      amount: parseFloat(updatedTransaction.amount),
      type: updatedTransaction.type,
      date: updatedTransaction.date instanceof Date ? updatedTransaction.date.toISOString().split('T')[0] : new Date(updatedTransaction.date).toISOString().split('T')[0], // Ensure date is string in YYYY-MM-DD format
      description: updatedTransaction.description,
      createdAt: updatedTransaction.created_at,
      updatedAt: updatedTransaction.updated_at
    };
  }

  public async deleteTransaction(id: string, userId: string, trx?: Knex.Transaction): Promise<boolean> {
    const deletedCount = await (trx || this.knex)(TransactionService.TABLE_NAME).where({ id, user_id: userId }).del();
    return deletedCount > 0;
  }

  public async getTransactionSummary(userId: string, startDate: string, endDate: string, trx?: Knex.Transaction): Promise<{ totalIncome: number; totalExpense: number; balance: number }> {
    const results = await (trx || this.knex)(TransactionService.TABLE_NAME)
      .where({ user_id: userId })
      .andWhere('date', '>=', startDate + 'T00:00:00.000Z')
      .andWhere('date', '<=', endDate + 'T23:59:59.999Z')
      .select(
        this.knex.raw("SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome"),
        this.knex.raw("SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense")
      )
      .first() as any;

    const totalIncome = parseFloat(results?.totalincome || '0') || 0;
    const totalExpense = parseFloat(results?.totalexpense || '0') || 0;
    const balance = totalIncome - totalExpense;

    return { totalIncome, totalExpense, balance };
  }

  public async getSpendingByCategory(userId: string, startDate: string, endDate: string, trx?: Knex.Transaction): Promise<Array<{ categoryName: string; categoryType: string; totalAmount: number }>> {
    const results = await (trx || this.knex)(TransactionService.TABLE_NAME)
      .join('categories', 'transactions.category_id', 'categories.id')
      .where('transactions.user_id', userId)
      .andWhere('transactions.date', '>=', startDate + 'T00:00:00.000Z')
      .andWhere('transactions.date', '<=', endDate + 'T23:59:59.999Z')
      .andWhere('transactions.type', 'expense') // Only interested in spending for categories
      .select(
        'categories.name as categoryName',
        'categories.type as categoryType',
        this.knex.raw("SUM(transactions.amount) as totalAmount")
      )
      .groupBy('categories.name', 'categories.type')
      .orderByRaw('SUM(transactions.amount) DESC');

    return results.map((row: any) => ({
      categoryName: row.categoryName,
      categoryType: row.categoryType,
      totalAmount: parseFloat(row.totalamount) || 0,
    }));
  }
}
