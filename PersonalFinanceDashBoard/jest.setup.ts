process.env.NODE_ENV = 'test'; // Ensure NODE_ENV is set to 'test'

import { Client } from 'pg';
import Knex from 'knex';
import type { Knex as KnexType } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import express from 'express';
const knexConfig = require('./knexfile.js');

const testDbName = `test_db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

let knexInstance: KnexType;

// Extend global namespace
declare global {
  var knexInstance: KnexType;
  var testApp: express.Application;
  var testUserId: string;
  var testCategoryId: string;
}

// Global setup: Create a new test database and run migrations
export const setupTests = async () => {
  // Ensure the DB_NAME, DB_USER, DB_PASSWORD environment variables are set for Knex
  process.env.DB_NAME = testDbName;
  process.env.DB_USER = process.env.DB_USER || 'pf_dashboard_user';
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

  // Set PGPASSWORD for the postgres superuser if required to create the test database
  process.env.PGPASSWORD = process.env.PGPASSWORD || 'postgres';

  // Connect to the default postgres database to create a new one
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database: 'postgres',
  });
  await adminClient.connect();

  // Check if the test user exists, if not, create it and grant privileges
  const userExistsResult = await adminClient.query(`SELECT 1 FROM pg_user WHERE usename = '${process.env.DB_USER}'`);
  if (userExistsResult.rowCount === 0) {
    console.log(`Creating user: ${process.env.DB_USER}`);
    await adminClient.query(`CREATE USER "${process.env.DB_USER}" WITH PASSWORD '${process.env.DB_PASSWORD}';`);
    await adminClient.query(`GRANT ALL PRIVILEGES ON DATABASE postgres TO "${process.env.DB_USER}";`);
  }

  // Terminate any existing connections to the test database if it already exists
  await adminClient.query(`SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${testDbName}' AND pid <> pg_backend_pid();`);
  await adminClient.query(`DROP DATABASE IF EXISTS ${testDbName};`);

  // Create a new test database
  await adminClient.query(`CREATE DATABASE ${testDbName} OWNER "${process.env.DB_USER}";`);
  await adminClient.end();

  // Create a fresh knex configuration with the new database name
  const baseConfig = knexConfig.development;
  
  const testConfig = {
    ...baseConfig,
    connection: {
      ...baseConfig.connection,
      database: testDbName,
      timezone: 'UTC'
    }
  };
  
  // Initialize knexInstance AFTER setting DB_NAME
  knexInstance = Knex(testConfig);

  // Make knexInstance available globally for tests
  global.knexInstance = knexInstance;

  // Run migrations on the new test database using the fresh knex instance
  await knexInstance.migrate.latest();

  // After migrations, insert a test user
  const testUserId = uuidv4();
  await knexInstance('users').insert({ 
    id: testUserId, 
    email: 'test@example.com', 
    password_hash: 'hashed_password', 
    username: 'testuser' 
  });

  // Make testUserId available globally for tests
  global.testUserId = testUserId;

  // Create a test category
  const testCategoryId = uuidv4();
  await knexInstance('categories').insert({
    id: testCategoryId,
    user_id: testUserId,
    name: 'Test Category',
    type: 'expense'
  });
  global.testCategoryId = testCategoryId;

  // Create Express app with transaction routes
  const app = express();
  app.use(express.json());

  // Import and set up transaction controller
  const { TransactionController } = await import('./src/api/controllers/TransactionController');
  const transactionController = new TransactionController(knexInstance);

  // Set up transaction routes
  app.post('/api/transactions', transactionController.createTransaction);
  app.get('/api/transactions', transactionController.getTransactions);
  app.get('/api/transactions/:id', transactionController.getTransactionById);
  app.put('/api/transactions/:id', transactionController.updateTransaction);
  app.delete('/api/transactions/:id', transactionController.deleteTransaction);

  // Set up category routes (placeholder for contract tests)
  app.get('/api/categories', (req, res) => {
    res.json([]);
  });
  app.post('/api/categories', (req, res) => {
    res.status(201).json({ id: 'test-category-id', ...req.body });
  });

  // Set up dashboard routes (placeholder for contract tests)
  app.get('/api/dashboard/summary', (req, res) => {
    res.json({ totalIncome: 0, totalExpense: 0, balance: 0 });
  });

  // Make app available globally for tests
  global.testApp = app;

  // Return necessary components for tests
  return { 
    knex: knexInstance, 
    app, 
    testUserId,
    transactionController
  };
};

// Global teardown: Rollback migrations and drop the test database
export const teardownTests = async () => {
  await knexInstance.migrate.rollback();
  await knexInstance.destroy();

  // Connect to the default postgres database to drop the test one
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database: 'postgres',
  });
  await adminClient.connect();

  // Terminate any existing connections to the test database
  await adminClient.query(`SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${testDbName}' AND pid <> pg_backend_pid();`);
  await adminClient.query(`DROP DATABASE IF EXISTS ${testDbName};`);
  await adminClient.end();
};

// Jest global setup
beforeAll(async () => {
  await setupTests();
});

// Jest global teardown
afterAll(async () => {
  await teardownTests();
});
