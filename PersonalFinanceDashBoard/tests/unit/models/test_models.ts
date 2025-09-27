import { User, Category, Transaction } from '../../../src/lib/finance-tracker/models';

describe('User Interface', () => {
  it('should correctly define a User object structure', () => {
    const user: User = {
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashedpassword123',
    };

    expect(user).toHaveProperty('username');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('passwordHash');
    expect(typeof user.username).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(typeof user.passwordHash).toBe('string');
  });

  it('should allow optional id, createdAt, and updatedAt properties', () => {
    const user: User = {
      id: 'some-uuid',
      username: 'testuser2',
      email: 'test2@example.com',
      passwordHash: 'hashedpassword456',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
    expect(typeof user.id).toBe('string');
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
});

describe('Category Interface', () => {
  it('should correctly define a Category object structure', () => {
    const category: Category = {
      userId: 'user-uuid-1',
      name: 'Groceries',
      type: 'expense',
    };

    expect(category).toHaveProperty('userId');
    expect(category).toHaveProperty('name');
    expect(category).toHaveProperty('type');
    expect(typeof category.userId).toBe('string');
    expect(typeof category.name).toBe('string');
    expect(category.type).toMatch(/^(expense|income)$/);
  });

  it('should allow optional id, createdAt, and updatedAt properties', () => {
    const category: Category = {
      id: 'category-uuid-1',
      userId: 'user-uuid-2',
      name: 'Salary',
      type: 'income',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(category).toHaveProperty('id');
    expect(category).toHaveProperty('createdAt');
    expect(category).toHaveProperty('updatedAt');
    expect(typeof category.id).toBe('string');
    expect(category.createdAt).toBeInstanceOf(Date);
    expect(category.updatedAt).toBeInstanceOf(Date);
  });
});

describe('Transaction Interface', () => {
  it('should correctly define a Transaction object structure', () => {
    const transaction: Transaction = {
      userId: 'user-uuid-1',
      amount: 50.75,
      type: 'expense',
      date: '2023-09-27',
      description: 'Coffee purchase',
    };

    expect(transaction).toHaveProperty('userId');
    expect(transaction).toHaveProperty('amount');
    expect(transaction).toHaveProperty('type');
    expect(transaction).toHaveProperty('date');
    expect(typeof transaction.userId).toBe('string');
    expect(typeof transaction.amount).toBe('number');
    expect(transaction.type).toMatch(/^(expense|income)$/);
    expect(typeof transaction.date).toBe('string');
    expect(transaction.description).toBeDefined();
  });

  it('should allow optional id, categoryId, description (null), createdAt, and updatedAt properties', () => {
    const transaction: Transaction = {
      id: 'transaction-uuid-1',
      userId: 'user-uuid-3',
      categoryId: null,
      amount: 1200.00,
      type: 'income',
      date: '2023-09-20',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(transaction).toHaveProperty('id');
    expect(transaction).toHaveProperty('categoryId');
    expect(transaction.categoryId).toBeNull();
    expect(transaction).toHaveProperty('createdAt');
    expect(transaction).toHaveProperty('updatedAt');
    expect(typeof transaction.id).toBe('string');
    expect(transaction.createdAt).toBeInstanceOf(Date);
    expect(transaction.updatedAt).toBeInstanceOf(Date);

    const transactionWithCategory: Transaction = {
      id: 'transaction-uuid-2',
      userId: 'user-uuid-4',
      categoryId: 'category-uuid-2',
      amount: 25.50,
      type: 'expense',
      date: '2023-09-25',
      description: 'Lunch',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(typeof transactionWithCategory.categoryId).toBe('string');
    expect(transactionWithCategory).toHaveProperty('description');
    expect(typeof transactionWithCategory.description).toBe('string');
  });

  it('should validate date format (basic check)', () => {
    const validDateTransaction: Transaction = {
      userId: 'user-uuid-1',
      amount: 10.00,
      type: 'expense',
      date: '2023-10-26',
    };
    expect(validDateTransaction.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // This would typically be handled by a validation library or runtime check
    // For interface tests, we primarily check structure, but adding a regex for date is a good practice.
    const invalidDateTransaction: Transaction = {
      userId: 'user-uuid-1',
      amount: 10.00,
      type: 'expense',
      date: '2023/10/26', // Invalid format
    };
    expect(invalidDateTransaction.date).not.toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
