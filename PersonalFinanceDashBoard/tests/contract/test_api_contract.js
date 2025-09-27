"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const fs_1 = require("fs");
const js_yaml_1 = require("js-yaml");
const API_BASE_URL = 'http://localhost:3000/api/v1'; // Replace with actual API base URL
const swaggerDocument = (0, js_yaml_1.load)((0, fs_1.readFileSync)('contracts/openapi.yaml', 'utf8'));
describe('API Contract Tests', () => {
    // Test for GET /transactions
    it('should retrieve transactions according to contract', () => __awaiter(void 0, void 0, void 0, function* () {
        // This test will fail until the API is implemented
        const res = yield (0, supertest_1.default)(API_BASE_URL).get('/transactions?startDate=2023-01-01&endDate=2023-01-31');
        expect(res.statusCode).toBe(200);
        // Further assertions can be added here to validate response schema
    }));
    // Test for POST /transactions
    it('should create a transaction according to contract', () => __awaiter(void 0, void 0, void 0, function* () {
        // This test will fail until the API is implemented
        const newTransaction = {
            amount: 50.00,
            type: 'expense',
            date: '2023-01-15',
            description: 'Groceries',
            categoryId: '60d0fe4f3a8b4c0001f3e7a1', // Example category ID
        };
        const res = yield (0, supertest_1.default)(API_BASE_URL).post('/transactions').send(newTransaction);
        expect(res.statusCode).toBe(201);
        // Further assertions can be added here to validate response schema
    }));
    // Test for GET /categories
    it('should retrieve categories according to contract', () => __awaiter(void 0, void 0, void 0, function* () {
        // This test will fail until the API is implemented
        const res = yield (0, supertest_1.default)(API_BASE_URL).get('/categories');
        expect(res.statusCode).toBe(200);
    }));
    // Test for POST /categories
    it('should create a category according to contract', () => __awaiter(void 0, void 0, void 0, function* () {
        // This test will fail until the API is implemented
        const newCategory = {
            name: 'Food',
            type: 'expense',
        };
        const res = yield (0, supertest_1.default)(API_BASE_URL).post('/categories').send(newCategory);
        expect(res.statusCode).toBe(201);
    }));
    // Test for GET /dashboard/summary
    it('should retrieve dashboard summary according to contract', () => __awaiter(void 0, void 0, void 0, function* () {
        // This test will fail until the API is implemented
        const res = yield (0, supertest_1.default)(API_BASE_URL).get('/dashboard/summary?startDate=2023-01-01&endDate=2023-01-31&groupBy=category');
        expect(res.statusCode).toBe(200);
    }));
});
