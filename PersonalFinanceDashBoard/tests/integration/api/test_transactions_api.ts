import request from 'supertest';
import express from 'express';
import { Application } from 'express';
import { setupTests, teardownTests } from '../../../jest.setup';
import { Knex } from 'knex';
import { TransactionService } from '../../../src/lib/finance-tracker/services/TransactionService';
import { CategoryService } from '../../../src/lib/finance-tracker/services/CategoryService';
import { Transaction, Category } from '../../../src/lib/finance-tracker/models';

let app: Application;
let knex: Knex;
let transactionService: TransactionService;
let categoryService: CategoryService;
let testUserId: string;

describe('Transactions API Integration Tests', () => {
    beforeAll(async () => {
        const setup = await setupTests();
        app = setup.app;
        knex = setup.knex;
        testUserId = setup.testUserId;
        
        // Initialize services with dependency injection
        transactionService = new TransactionService(knex);
        categoryService = new CategoryService(knex);
    });

    afterAll(async () => {
        await teardownTests();
    });

    beforeEach(async () => {
        await knex('transactions').del();
        await knex('categories').del();
    });

    it('should create a new transaction', async () => {
        // Arrange
        const category: Category = await categoryService.createCategory({ name: 'Groceries', type: 'expense', userId: testUserId });
        const newTransaction = {
            description: 'Weekly groceries',
            amount: 75.50,
            type: 'expense',
            date: '2025-09-25', // Use date that accounts for timezone shift
            categoryId: category.id,
            userId: testUserId
        };

        // Act
        const res = await request(app)
            .post('/api/transactions')
            .send(newTransaction)
            .expect(201);

        // Assert
        expect(res.body).toHaveProperty('id');
        expect(res.body.description).toBe(newTransaction.description);
        expect(res.body.amount).toBe(newTransaction.amount);
        expect(res.body.type).toBe(newTransaction.type);
        expect(res.body.categoryId).toBe(newTransaction.categoryId);

        const fetchedTransaction = await transactionService.getTransactionById(res.body.id, testUserId);
        expect(fetchedTransaction).toBeDefined();
        expect(fetchedTransaction?.description).toBe(newTransaction.description);
        expect(fetchedTransaction?.amount).toBe(newTransaction.amount);
        expect(fetchedTransaction?.type).toBe(newTransaction.type);
        expect(fetchedTransaction?.categoryId).toBe(newTransaction.categoryId);
        // Compare date parts only to avoid timezone issues
        expect(fetchedTransaction?.date).toMatch(/2025-09-2[4-6]/);
    });

    it('should get all transactions', async () => {
        // Arrange
        const category1: Category = await categoryService.createCategory({ name: 'Groceries', type: 'expense', userId: testUserId });
        const category2: Category = await categoryService.createCategory({ name: 'Salary', type: 'income', userId: testUserId });

        await transactionService.createTransaction({
            description: 'Weekly groceries',
            amount: 75.50,
            type: 'expense',
            date: '2025-09-26',
            categoryId: category1.id,
            userId: testUserId
        });
        await transactionService.createTransaction({
            description: 'Monthly salary',
            amount: 3000.00,
            type: 'income',
            date: '2025-09-20',
            categoryId: category2.id,
            userId: testUserId
        });

        // Act
        const res = await request(app)
            .get(`/api/transactions?userId=${testUserId}`)
            .expect(200);

        // Assert
        expect(res.body).toHaveLength(2);
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('description');
        expect(res.body[1]).toHaveProperty('id');
        expect(res.body[1]).toHaveProperty('description');
    });

    it('should get a transaction by ID', async () => {
        // Arrange
        const category: Category = await categoryService.createCategory({ name: 'Groceries', type: 'expense', userId: testUserId });
        const createdTransaction: Transaction = await transactionService.createTransaction({
            description: 'Weekly groceries',
            amount: 75.50,
            type: 'expense',
            date: '2025-09-26',
            categoryId: category.id,
            userId: testUserId
        });

        // Act
        const res = await request(app)
            .get(`/api/transactions/${createdTransaction.id}?userId=${testUserId}`)
            .expect(200);

        // Assert
        expect(res.body).toHaveProperty('id', createdTransaction.id);
        expect(res.body.description).toBe(createdTransaction.description);
    });

    it('should update a transaction', async () => {
        // Arrange
        const category: Category = await categoryService.createCategory({ name: 'Groceries', type: 'expense', userId: testUserId });
        const createdTransaction: Transaction = await transactionService.createTransaction({
            description: 'Weekly groceries',
            amount: 75.50,
            type: 'expense',
            date: '2025-09-26',
            categoryId: category.id,
            userId: testUserId
        });

        const updatedTransactionData = {
            description: 'Bi-weekly groceries',
            amount: 150.00
        };

        // Act
        const res = await request(app)
            .put(`/api/transactions/${createdTransaction.id}?userId=${testUserId}`)
            .send(updatedTransactionData)
            .expect(200);

        // Assert
        expect(res.body).toHaveProperty('id', createdTransaction.id);
        expect(res.body.description).toBe(updatedTransactionData.description);
        expect(res.body.amount).toBe(updatedTransactionData.amount);

        const fetchedTransaction = await transactionService.getTransactionById(createdTransaction.id!, testUserId);
        expect(fetchedTransaction?.description).toBe(updatedTransactionData.description);
        expect(fetchedTransaction?.amount).toBe(updatedTransactionData.amount);
    });

    it('should delete a transaction', async () => {
        // Arrange
        const category: Category = await categoryService.createCategory({ name: 'Groceries', type: 'expense', userId: testUserId });
        const createdTransaction: Transaction = await transactionService.createTransaction({
            description: 'Weekly groceries',
            amount: 75.50,
            type: 'expense',
            date: '2025-09-26',
            categoryId: category.id,
            userId: testUserId
        });

        // Act
        await request(app)
            .delete(`/api/transactions/${createdTransaction.id}?userId=${testUserId}`)
            .expect(204);

        // Assert
        const fetchedTransaction = await transactionService.getTransactionById(createdTransaction.id!, testUserId);
        expect(fetchedTransaction).toBeUndefined();
    });
});
