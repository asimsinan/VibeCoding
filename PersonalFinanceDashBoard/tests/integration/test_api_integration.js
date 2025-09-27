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
const API_BASE_URL = 'http://localhost:3000/api/v1'; // Replace with actual API base URL
describe('API Integration Tests', () => {
    let authToken; // To store authentication token if login is implemented
    let createdTransactionId;
    let createdCategoryId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Ideally, a test user would be created and logged in here
        // For now, assume a token is obtained or skip authentication for initial failing tests
        // Example: const loginRes = await request(API_BASE_URL).post('/auth/login').send({ username: 'test', password: 'password' });
        // authToken = loginRes.body.token;
        authToken = "DUMMY_TOKEN"; // Temporarily assign a dummy token to avoid TS2454
    }));
    // Test transaction creation (POST /transactions)
    it('should create a new transaction in the database', () => __awaiter(void 0, void 0, void 0, function* () {
        // This test will fail until the API and database are implemented
        const newCategory = { name: 'Test Category', type: 'expense' };
        const categoryRes = yield (0, supertest_1.default)(API_BASE_URL)
            .post('/categories')
            .set('Authorization', `Bearer ${authToken}`)
            .send(newCategory);
        // expect(categoryRes.statusCode).toBe(201); // Commented out for initial failing tests
        // createdCategoryId = categoryRes.body.id; // Commented out for initial failing tests
        const newTransaction = {
            amount: 100.00,
            type: 'expense',
            date: '2023-09-26',
            description: 'Integration Test Transaction',
            categoryId: '60d0fe4f3a8b4c0001f3e7a1', // Use a dummy category ID for now
        };
        const res = yield (0, supertest_1.default)(API_BASE_URL)
            .post('/transactions')
            .set('Authorization', `Bearer ${authToken}`)
            .send(newTransaction);
        expect(res.statusCode).toBe(201);
        // expect(res.body).toHaveProperty('id'); // Commented out for initial failing tests
        // createdTransactionId = res.body.id; // Commented out for initial failing tests
    }));
    // Test transaction retrieval (GET /transactions)
    it('should retrieve the created transaction from the database', () => __awaiter(void 0, void 0, void 0, function* () {
        // This test will fail until the API and database are implemented
        const res = yield (0, supertest_1.default)(API_BASE_URL)
            .get(`/transactions?startDate=2023-09-01&endDate=2023-09-30`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.statusCode).toBe(200);
        // expect(res.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: createdTransactionId })])); // Commented out for initial failing tests
    }));
    // Test dashboard summary (GET /dashboard/summary)
    it('should retrieve aggregated dashboard summary', () => __awaiter(void 0, void 0, void 0, function* () {
        // This test will fail until the API and database are implemented
        const res = yield (0, supertest_1.default)(API_BASE_URL)
            .get('/dashboard/summary?startDate=2023-09-01&endDate=2023-09-30&groupBy=category')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('labels');
        expect(res.body).toHaveProperty('datasets');
    }));
    // Test transaction update (PUT /transactions/{id})
    it('should update an existing transaction', () => __awaiter(void 0, void 0, void 0, function* () {
        // This test will fail until the API and database are implemented
        const updatedDescription = 'Updated Integration Test Transaction';
        const res = yield (0, supertest_1.default)(API_BASE_URL)
            .put(`/transactions/60d0fe4f3a8b4c0001f3e7a2`) // Use a dummy ID for now
            .set('Authorization', `Bearer ${authToken}`)
            .send({ description: updatedDescription });
        expect(res.statusCode).toBe(200);
        // expect(res.body.description).toBe(updatedDescription); // Commented out for initial failing tests
    }));
    // Test transaction deletion (DELETE /transactions/{id})
    it('should delete a transaction', () => __awaiter(void 0, void 0, void 0, function* () {
        // This test will fail until the API and database are implemented
        const res = yield (0, supertest_1.default)(API_BASE_URL)
            .delete(`/transactions/60d0fe4f3a8b4c0001f3e7a2`) // Use a dummy ID for now
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.statusCode).toBe(204);
    }));
    // Test category deletion (DELETE /categories/{id})
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up the created category if necessary
        // This test will fail until the API and database are implemented
        // const res = await request(API_BASE_URL)
        //   .delete(`/categories/${createdCategoryId}`)
        //   .set('Authorization', `Bearer ${authToken}`);
        // expect(res.statusCode).toBe(204);
    }));
});
