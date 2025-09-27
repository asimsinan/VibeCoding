module.exports = {
  displayName: 'E2E Integration Tests',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/../../web'],
  testMatch: ['<rootDir>/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../web/src/$1',
    '^axios$': '<rootDir>/../../web/node_modules/axios',
    '^axios-mock-adapter$': '<rootDir>/../../web/node_modules/axios-mock-adapter',
    '^@testing-library/react$': '<rootDir>/../../web/node_modules/@testing-library/react',
    '^@testing-library/jest-dom$': '<rootDir>/../../web/node_modules/@testing-library/jest-dom',
    '^@tanstack/react-query$': '<rootDir>/../../web/node_modules/@tanstack/react-query',
    '^react$': '<rootDir>/../../web/node_modules/react',
    '^react-dom$': '<rootDir>/../../web/node_modules/react-dom',
    '^react/jsx-runtime$': '<rootDir>/../../web/node_modules/react/jsx-runtime',
    '^react/jsx-dev-runtime$': '<rootDir>/../../web/node_modules/react/jsx-dev-runtime',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: '<rootDir>/../../web/tsconfig.json'
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(axios|nanoid|uuid|@tanstack|@testing-library)/)',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  setupFilesAfterEnv: ['<rootDir>/../setupTests.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 10000,
};
