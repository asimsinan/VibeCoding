import { CategoryService } from '../../../src/lib/finance-tracker/services/CategoryService';
import { TransactionService } from '../../../src/lib/finance-tracker/services/TransactionService';
import { User, Category, Transaction } from '../../../src/lib/finance-tracker/models';
import { Knex } from 'knex';

// Import the knex instance from jest.setup.ts
declare global {
  var knexInstance: Knex;
}

describe('CategoryService Integration Tests', () => {
  let userId: string;
  let trx: Knex.Transaction;
  let categoryService: CategoryService;

  beforeEach(async () => {
    trx = await global.knexInstance.transaction(); // Start a new transaction for each test
    // Create a dummy user for testing, cleanup is handled by transaction rollback
    const [user] = await (trx)('users').insert({
      username: 'testuser_service',
      email: 'test_service@example.com',
      password_hash: 'hashedpassword',
    }).returning('id');
    userId = user.id;
    categoryService = new CategoryService(global.knexInstance);
  });

  afterEach(async () => {
    await trx.rollback(); // Rollback the transaction to clean up test data
  });

  it('should create and retrieve a category', async () => {
    const newCategory: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      name: 'Groceries',
      type: 'expense',
    };
    const createdCategory = await categoryService.createCategory(newCategory, trx);
    expect(createdCategory).toHaveProperty('id');
    expect(createdCategory.name).toBe('Groceries');

    const retrievedCategory = await categoryService.getCategoryById(createdCategory.id!, userId, trx);
    expect(retrievedCategory).toEqual(createdCategory);
  });

  it('should list categories for a user', async () => {
    await categoryService.createCategory({ userId, name: 'Rent', type: 'expense' }, trx);
    await categoryService.createCategory({ userId, name: 'Salary', type: 'income' }, trx);

    const categories = await categoryService.getCategories({ userId }, trx);
    expect(categories.length).toBe(2); // Rent, Salary
    expect(categories.some(c => c.name === 'Rent')).toBe(true);
    expect(categories.some(c => c.name === 'Salary')).toBe(true);
  });

  it('should update a category', async () => {
    const categoryToUpdate = await categoryService.createCategory({ userId, name: 'Old Name', type: 'expense' }, trx);
    const updatedCategory = await categoryService.updateCategory(categoryToUpdate.id!, userId, { name: 'New Name' }, trx);
    expect(updatedCategory?.name).toBe('New Name');
  });

  it('should delete a category', async () => {
    const categoryToDelete = await categoryService.createCategory({ userId, name: 'To Delete', type: 'expense' }, trx);
    const deleted = await categoryService.deleteCategory(categoryToDelete.id!, userId, trx);
    expect(deleted).toBe(true);

    const retrieved = await categoryService.getCategoryById(categoryToDelete.id!, userId, trx);
    expect(retrieved).toBeUndefined();
  });
});

describe('TransactionService Integration Tests', () => {
  let userId: string;
  let categoryId: string;
  let trx: Knex.Transaction;
  let transactionService: TransactionService;
  let categoryService: CategoryService;

  beforeEach(async () => {
    trx = await global.knexInstance.transaction(); // Start a new transaction for each test
    // Create a dummy user and category for testing, cleanup is handled by transaction rollback
    const [user] = await (trx)('users').insert({
      username: 'testuser_transactions',
      email: 'test_transactions@example.com',
      password_hash: 'hashedpassword',
    }).returning('id');
    userId = user.id;
    transactionService = new TransactionService(global.knexInstance);
    categoryService = new CategoryService(global.knexInstance);

    const [category] = await (trx)('categories').insert({
      user_id: userId,
      name: 'Food',
      type: 'expense',
    }).returning('id');
    categoryId = category.id;
  });

  afterEach(async () => {
    await trx.rollback(); // Rollback the transaction to clean up test data
  });

  it('should create and retrieve a transaction', async () => {
    const newTransaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      categoryId,
      amount: 50.00,
      type: 'expense',
      date: '2023-09-27',
      description: 'Lunch',
    };
    const createdTransaction = await transactionService.createTransaction(newTransaction, trx);
    expect(createdTransaction).toHaveProperty('id');
    expect(createdTransaction.amount).toBe(50.00);

    const retrievedTransaction = await transactionService.getTransactionById(createdTransaction.id!, userId, trx);
    expect(retrievedTransaction).toEqual(createdTransaction);
  });

  it('should list transactions for a user with filters', async () => {
    await transactionService.createTransaction({ userId, categoryId, amount: 20.00, type: 'expense', date: '2023-09-26', description: 'Breakfast' }, trx);
    await transactionService.createTransaction({ userId, categoryId, amount: 100.00, type: 'income', date: '2023-09-27', description: 'Salary' }, trx);

    const allTransactions = await transactionService.getTransactions({ userId }, trx);
    expect(allTransactions.length).toBe(2); // Breakfast and Salary

    const expenseTransactions = await transactionService.getTransactions({ userId, type: 'expense' }, trx);
    expect(expenseTransactions.length).toBe(1);

    const transactionsByDate = await transactionService.getTransactions({ userId, startDate: '2023-09-27', endDate: '2023-09-27' }, trx);
    expect(transactionsByDate.length).toBe(1); // Salary
  });

  it('should update a transaction', async () => {
    const transactionToUpdate = await transactionService.createTransaction({ userId, categoryId, amount: 30.00, type: 'expense', date: '2023-09-28', description: 'Coffee' }, trx);
    const updatedTransaction = await transactionService.updateTransaction(transactionToUpdate.id!, userId, { amount: 35.00, description: 'Updated Coffee' }, trx);
    expect(updatedTransaction?.amount).toBe(35.00);
    expect(updatedTransaction?.description).toBe('Updated Coffee');
  });

  it('should delete a transaction', async () => {
    const transactionToDelete = await transactionService.createTransaction({ userId, categoryId, amount: 15.00, type: 'expense', date: '2023-09-29', description: 'Snack' }, trx);
    const deleted = await transactionService.deleteTransaction(transactionToDelete.id!, userId, trx);
    expect(deleted).toBe(true);

    const retrieved = await transactionService.getTransactionById(transactionToDelete.id!, userId, trx);
    expect(retrieved).toBeUndefined();
  });

  it('should get transaction summary', async () => {
    // Ensure some data for summary
    // TRUNCATE is handled globally by the beforeEach in jest.setup.ts, but since we are using transactions,
    // each test is isolated, so we don't need to clean up here.
    const tempCategoryId = (await categoryService.createCategory({ userId, name: 'Temp Cat', type: 'expense' }, trx)).id;

    await transactionService.createTransaction({ userId, categoryId: tempCategoryId, amount: 500, type: 'income', date: '2023-10-01' }, trx);
    await transactionService.createTransaction({ userId, categoryId: tempCategoryId, amount: 100, type: 'expense', date: '2023-10-02' }, trx);
    await transactionService.createTransaction({ userId, categoryId: tempCategoryId, amount: 50, type: 'expense', date: '2023-10-03' }, trx);

    const summary = await transactionService.getTransactionSummary(userId, '2023-10-01', '2023-10-31', trx);
    expect(summary.totalIncome).toBe(500);
    expect(summary.totalExpense).toBe(150);
    expect(summary.balance).toBe(350);
  });

  it('should get spending by category', async () => {
    // TRUNCATE is handled globally by the beforeEach in jest.setup.ts, but since we are using transactions,
    // each test is isolated, so we don't need to clean up here.
    const [foodCategory] = await (trx)('categories').insert({ user_id: userId, name: 'Food', type: 'expense' }).returning('id');
    const [transportCategory] = await (trx)('categories').insert({ user_id: userId, name: 'Transport', type: 'expense' }).returning('id');
    
    await transactionService.createTransaction({ userId, categoryId: foodCategory.id, amount: 50, type: 'expense', date: '2023-10-01' }, trx);
    await transactionService.createTransaction({ userId, categoryId: foodCategory.id, amount: 30, type: 'expense', date: '2023-10-02' }, trx);
    await transactionService.createTransaction({ userId, categoryId: transportCategory.id, amount: 20, type: 'expense', date: '2023-10-02' }, trx);
    await transactionService.createTransaction({ userId, categoryId: transportCategory.id, amount: 15, type: 'expense', date: '2023-10-03' }, trx);

    const spending = await transactionService.getSpendingByCategory(userId, '2023-10-01', '2023-10-31', trx);
    expect(spending.length).toBe(2);
    expect(spending).toEqual(expect.arrayContaining([
      expect.objectContaining({ categoryName: 'Food', totalAmount: 80 }),
      expect.objectContaining({ categoryName: 'Transport', totalAmount: 35 }),
    ]));
  });
});
