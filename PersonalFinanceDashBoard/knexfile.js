"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
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
            directory: "./database/migrations",
        },
        seeds: {
            directory: "./database/seeds",
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
            directory: "./database/migrations",
        },
        seeds: {
            directory: "./database/seeds",
        },
    },
};
module.exports = config;
