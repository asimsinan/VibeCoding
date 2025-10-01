# UI-API Integration Tests

This directory contains comprehensive integration tests for the Personal Shopping Assistant frontend application.

## Test Structure

```
src/__tests__/
├── setup.ts                    # Test environment setup
├── mocks/
│   └── apiMock.ts             # API mocking service
├── utils/
│   └── testUtils.tsx          # Test utilities and helpers
├── integration/
│   ├── dataFlow.test.tsx      # Data flow integration tests
│   ├── components.test.tsx    # Component integration tests
│   ├── stateManagement.test.tsx # State management tests
│   └── errorHandling.test.tsx # Error handling tests
└── README.md                  # This file
```

## Test Categories

### 1. Data Flow Integration Tests (`dataFlow.test.tsx`)
Tests the complete data flow between UI components and API services:
- Authentication data flow
- Product data loading and display
- Recommendation generation and display
- User interaction tracking
- Error handling and recovery
- Loading states management
- State synchronization

### 2. Component Integration Tests (`components.test.tsx`)
Tests the integration between individual UI components and API services:
- ProductCard component integration
- ProductList component integration
- UserPreferences component integration
- RecommendationList component integration
- Loading states integration
- Error handling integration

### 3. State Management Integration Tests (`stateManagement.test.tsx`)
Tests the state management system integration:
- AppContext state management
- Product state management
- User interaction state management
- State reset and cleanup
- Online/offline state management

### 4. Error Handling Integration Tests (`errorHandling.test.tsx`)
Tests comprehensive error handling across the application:
- API error handling
- Component error handling
- Error recovery mechanisms
- Error state management
- User experience during errors
- Error logging and monitoring
- Graceful degradation

## Test Utilities

### API Mock Service (`mocks/apiMock.ts`)
Provides comprehensive API mocking for testing:
- Mock data for products, users, recommendations
- Simulated API responses with configurable delays
- Error simulation capabilities
- Reset functionality for test isolation

### Test Utilities (`utils/testUtils.tsx`)
Provides utilities and helpers for testing:
- Custom render function with providers
- Test data factories
- Mock helpers for localStorage, fetch, etc.
- Environment setup utilities

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### CI Mode
```bash
npm run test:ci
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Test environment: jsdom
- Setup files: `src/__tests__/setup.ts`
- Module name mapping for path aliases
- Coverage thresholds: 80% for all metrics
- Test timeout: 10 seconds

### Babel Configuration (`babel.config.js`)
- Presets for TypeScript, React, and modern JavaScript
- Automatic runtime for React JSX

## Test Coverage

The tests aim for 80% coverage across:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Mocking Strategy

### API Services
All API services are mocked using Jest mocks:
- `authService` - Authentication operations
- `productService` - Product CRUD operations
- `recommendationService` - Recommendation operations
- `interactionService` - User interaction tracking

### External Dependencies
- `fetch` - HTTP requests
- `localStorage` - Browser storage
- `sessionStorage` - Session storage
- `IntersectionObserver` - Intersection API
- `ResizeObserver` - Resize API

## Test Data

### Mock Products
```typescript
const mockProduct = {
  id: 1,
  name: 'Test Product',
  description: 'A test product',
  price: 99.99,
  category: 'electronics',
  brand: 'TestBrand',
  rating: 4.5,
  imageUrl: 'https://example.com/product.jpg',
  inStock: true,
  style: 'modern',
};
```

### Mock User
```typescript
const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};
```

### Mock Recommendations
```typescript
const mockRecommendation = {
  id: 1,
  userId: 1,
  productId: 1,
  score: 0.95,
  algorithm: 'content_based',
  createdAt: new Date('2023-01-01'),
  product: mockProduct,
};
```

## Best Practices

### Test Isolation
- Each test is isolated using `beforeEach` cleanup
- Mocks are reset between tests
- No shared state between tests

### Async Testing
- Use `waitFor` for async operations
- Use `act` for state updates
- Proper error handling in async tests

### Error Testing
- Test both success and failure scenarios
- Verify error messages are displayed
- Test error recovery mechanisms

### Component Testing
- Test user interactions
- Verify API calls are made
- Test loading and error states

## Debugging Tests

### Running Individual Tests
```bash
npm test -- --testNamePattern="Data Flow Integration"
```

### Debug Mode
```bash
npm test -- --detectOpenHandles --forceExit
```

### Verbose Output
```bash
npm test -- --verbose
```

## Continuous Integration

The tests are designed to run in CI environments:
- No watch mode
- Coverage reporting
- Exit on test failure
- Parallel execution

## Troubleshooting

### Common Issues

1. **Test Timeout**: Increase timeout in Jest config
2. **Mock Issues**: Ensure mocks are properly reset
3. **Async Issues**: Use proper async/await patterns
4. **Memory Leaks**: Check for unclosed handles

### Debug Commands
```bash
# Run specific test file
npm test -- dataFlow.test.tsx

# Run with debug output
npm test -- --verbose --no-cache

# Run with coverage
npm test -- --coverage --watchAll=false
```
