import type { Knex } from "knex";
import path from 'path';

const migrationsDir = path.resolve(__dirname, '../database/migrations');
const seedsDir = path.resolve(__dirname, '../database/seeds');
// const testDbPath = path.resolve(__dirname, '../database/test.sqlite3'); // Remove sqlite test DB path

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: {
      database: process.env.DB_NAME || "personal_finance_dashboard",
      user: process.env.DB_USER || "pf_dashboard_user",
      password: process.env.DB_PASSWORD || "postgres", // IMPORTANT: Use environment variables in production
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: migrationsDir,
    },
    seeds: {
      directory: seedsDir,
    },
  },

  test: {
    client: "pg",
    connection: {
      database: process.env.DB_NAME || "personal_finance_dashboard_test",
      user: process.env.DB_USER || "pf_dashboard_user",
      password: process.env.DB_PASSWORD || "postgres",
    },
    pool: {
      min: 1,
      max: 5,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: migrationsDir,
    },
    seeds: {
      directory: seedsDir,
    },
  },
  
  production: {
    client: "pg",
    connection: process.env.DATABASE_URL, // Use DATABASE_URL for production
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: migrationsDir,
    },
    seeds: {
      directory: seedsDir,
    },
  },
};

module.exports = config;
