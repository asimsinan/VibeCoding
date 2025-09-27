import { Command } from 'commander';
import { CategoryService } from './services/CategoryService';
import { TransactionService } from './services/TransactionService';
import { Category, Transaction } from './models';
import knex from 'knex';
import knexConfig from '../../../knexfile';

const program = new Command();

// Initialize database connection and services
const db = knex(knexConfig.development);
const categoryService = new CategoryService(db);
const transactionService = new TransactionService(db);

program
  .name('finance-tracker')
  .description('CLI for managing personal finance transactions and categories')
  .version('1.0.0');

// --- Category Commands ---
const category = program.command('category')
  .description('Manage categories');

category.command('add <userId> <name> <type>')
  .description('Add a new category (type: expense or income)')
  .option('-j, --json', 'Output in JSON format')
  .action(async (userId, name, type, options) => {
    try {
      if (type !== 'expense' && type !== 'income') {
        throw new Error('Category type must be \'expense\' or \'income\'');
      }
      const newCategory: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        name,
        type,
      };
      const createdCategory = await categoryService.createCategory(newCategory);
      if (options.json) {
        console.log(JSON.stringify(createdCategory, null, 2));
      } else {
        console.log(`Category '${createdCategory.name}' (${createdCategory.type}) created with ID: ${createdCategory.id}`);
      }
    } catch (error: any) {
      console.error(`Error adding category: ${error.message}`);
    }
  });

category.command('list <userId>')
  .description('List all categories for a user')
  .option('-t, --type <type>', 'Filter by type (expense or income)')
  .option('-j, --json', 'Output in JSON format')
  .action(async (userId, options) => {
    try {
      const filters = { userId, type: options.type };
      const categories = await categoryService.getCategories(filters);
      if (options.json) {
        console.log(JSON.stringify(categories, null, 2));
      } else {
        categories.forEach(cat => {
          console.log(`ID: ${cat.id}, Name: ${cat.name}, Type: ${cat.type}`);
        });
      }
    } catch (error: any) {
      console.error(`Error listing categories: ${error.message}`);
    }
  });

category.command('update <id> <userId>')
  .description('Update a category by ID')
  .option('-n, --name <name>', 'New category name')
  .option('-t, --type <type>', 'New category type (expense or income)')
  .option('-j, --json', 'Output in JSON format')
  .action(async (id, userId, options) => {
    try {
      const updates: Partial<Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = {};
      if (options.name) updates.name = options.name;
      if (options.type) {
        if (options.type !== 'expense' && options.type !== 'income') {
          throw new Error('Category type must be \'expense\' or \'income\'');
        }
        updates.type = options.type;
      }
      
      if (Object.keys(updates).length === 0) {
        throw new Error('No updates provided. Use -n or -t options.');
      }

      const updatedCategory = await categoryService.updateCategory(id, userId, updates);
      if (options.json) {
        console.log(JSON.stringify(updatedCategory, null, 2));
      } else if (updatedCategory) {
        console.log(`Category ID ${updatedCategory.id} updated: Name: ${updatedCategory.name}, Type: ${updatedCategory.type}`);
      } else {
        console.log(`Category ID ${id} not found or not owned by user ${userId}.`);
      }
    } catch (error: any) {
      console.error(`Error updating category: ${error.message}`);
    }
  });

category.command('delete <id> <userId>')
  .description('Delete a category by ID')
  .option('-j, --json', 'Output in JSON format')
  .action(async (id, userId, options) => {
    try {
      const deleted = await categoryService.deleteCategory(id, userId);
      if (options.json) {
        console.log(JSON.stringify({ id, deleted }, null, 2));
      } else if (deleted) {
        console.log(`Category ID ${id} deleted successfully.`);
      } else {
        console.log(`Category ID ${id} not found or not owned by user ${userId}.`);
      }
    } catch (error: any) {
      console.error(`Error deleting category: ${error.message}`);
    }
  });

// --- Transaction Commands ---
const transaction = program.command('transaction')
  .description('Manage transactions');

transaction.command('add <userId> <amount> <type> <date>')
  .description('Add a new transaction')
  .option('-c, --categoryId <id>', 'Category ID')
  .option('-d, --description <description>', 'Transaction description')
  .option('-j, --json', 'Output in JSON format')
  .action(async (userId, amount, type, date, options) => {
    try {
      if (type !== 'expense' && type !== 'income') {
        throw new Error('Transaction type must be \'expense\' or \'income\'');
      }
      const newTransaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        amount: parseFloat(amount),
        type,
        date,
        categoryId: options.categoryId || null,
        description: options.description || null,
      };
      const createdTransaction = await transactionService.createTransaction(newTransaction);
      if (options.json) {
        console.log(JSON.stringify(createdTransaction, null, 2));
      } else {
        console.log(`Transaction ID: ${createdTransaction.id}, Amount: ${createdTransaction.amount}, Type: ${createdTransaction.type}`);
      }
    } catch (error: any) {
      console.error(`Error adding transaction: ${error.message}`);
    }
  });

transaction.command('list <userId>')
  .description('List all transactions for a user')
  .option('-s, --startDate <date>', 'Filter by start date (YYYY-MM-DD)')
  .option('-e, --endDate <date>', 'Filter by end date (YYYY-MM-DD)')
  .option('-c, --categoryId <id>', 'Filter by category ID')
  .option('-t, --type <type>', 'Filter by type (expense or income)')
  .option('-l, --limit <limit>', 'Limit number of results')
  .option('-o, --offset <offset>', 'Offset results')
  .option('-j, --json', 'Output in JSON format')
  .action(async (userId, options) => {
    try {
      const filters = {
        userId,
        startDate: options.startDate,
        endDate: options.endDate,
        categoryId: options.categoryId,
        type: options.type,
        limit: options.limit ? parseInt(options.limit) : undefined,
        offset: options.offset ? parseInt(options.offset) : undefined,
      };
      const transactions = await transactionService.getTransactions(filters);
      if (options.json) {
        console.log(JSON.stringify(transactions, null, 2));
      } else {
        transactions.forEach(t => {
          console.log(`ID: ${t.id}, Amount: ${t.amount}, Type: ${t.type}, Date: ${t.date}, Desc: ${t.description || 'N/A'}`);
        });
      }
    } catch (error: any) {
      console.error(`Error listing transactions: ${error.message}`);
    }
  });

transaction.command('update <id> <userId>')
  .description('Update a transaction by ID')
  .option('-a, --amount <amount>', 'New amount')
  .option('-t, --type <type>', 'New type (expense or income)')
  .option('-d, --date <date>', 'New date (YYYY-MM-DD)')
  .option('-c, --categoryId <id>', 'New category ID (use \'null\' to unset)')
  .option('-D, --description <description>', 'New description (use \'null\' to unset)')
  .option('-j, --json', 'Output in JSON format')
  .action(async (id, userId, options) => {
    try {
      const updates: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = {};
      if (options.amount) updates.amount = parseFloat(options.amount);
      if (options.type) {
        if (options.type !== 'expense' && options.type !== 'income') {
          throw new Error('Transaction type must be \'expense\' or \'income\'');
        }
        updates.type = options.type;
      }
      if (options.date) updates.date = options.date;
      if (options.categoryId !== undefined) {
        updates.categoryId = options.categoryId === 'null' ? null : options.categoryId;
      }
      if (options.description !== undefined) {
        updates.description = options.description === 'null' ? null : options.description;
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('No updates provided.');
      }

      const updatedTransaction = await transactionService.updateTransaction(id, userId, updates);
      if (options.json) {
        console.log(JSON.stringify(updatedTransaction, null, 2));
      } else if (updatedTransaction) {
        console.log(`Transaction ID ${updatedTransaction.id} updated.`);
      } else {
        console.log(`Transaction ID ${id} not found or not owned by user ${userId}.`);
      }
    } catch (error: any) {
      console.error(`Error updating transaction: ${error.message}`);
    }
  });

transaction.command('delete <id> <userId>')
  .description('Delete a transaction by ID')
  .option('-j, --json', 'Output in JSON format')
  .action(async (id, userId, options) => {
    try {
      const deleted = await transactionService.deleteTransaction(id, userId);
      if (options.json) {
        console.log(JSON.stringify({ id, deleted }, null, 2));
      } else if (deleted) {
        console.log(`Transaction ID ${id} deleted successfully.`);
      } else {
        console.log(`Transaction ID ${id} not found or not owned by user ${userId}.`);
      }
    } catch (error: any) {
      console.error(`Error deleting transaction: ${error.message}`);
    }
  });

// --- Dashboard Summary Command ---
program.command('summary <userId> <startDate> <endDate>')
  .description('Get financial summary for a user within a date range')
  .option('-j, --json', 'Output in JSON format')
  .action(async (userId, startDate, endDate, options) => {
    try {
      const summary = await transactionService.getTransactionSummary(userId, startDate, endDate);
      const spendingByCategory = await transactionService.getSpendingByCategory(userId, startDate, endDate);
      
      if (options.json) {
        console.log(JSON.stringify({ summary, spendingByCategory }, null, 2));
      } else {
        console.log(`Financial Summary for User ${userId} (${startDate} to ${endDate}):`);
        console.log(`  Total Income: ${summary.totalIncome.toFixed(2)}`);
        console.log(`  Total Expense: ${summary.totalExpense.toFixed(2)}`);
        console.log(`  Balance: ${summary.balance.toFixed(2)}`);
        console.log('\nSpending by Category:');
        if (spendingByCategory.length > 0) {
          spendingByCategory.forEach(sbc => {
            console.log(`  - ${sbc.categoryName} (${sbc.categoryType}): ${sbc.totalAmount.toFixed(2)}`);
          });
        } else {
          console.log('  No spending found for this period.');
        }
      }
    } catch (error: any) {
      console.error(`Error getting summary: ${error.message}`);
    }
  });


program.parse(process.argv);
