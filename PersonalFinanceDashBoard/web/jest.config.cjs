module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  roots: ['<rootDir>/src', '<rootDir>/../tests/web'],
  testMatch: [
    '<rootDir>/../tests/web/**/*.test.ts',
    '<rootDir>/../tests/web/**/*.test.tsx',
    '<rootDir>/../tests/web/**/*.spec.ts',
    '<rootDir>/../tests/web/**/*.spec.tsx',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^axios$': '<rootDir>/node_modules/axios',
    '^axios-mock-adapter$': '<rootDir>/node_modules/axios-mock-adapter',
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^@tanstack/react-query$': '<rootDir>/node_modules/@tanstack/react-query',
    '^@testing-library/react$': '<rootDir>/node_modules/@testing-library/react',
    '^@testing-library/jest-dom$': '<rootDir>/node_modules/@testing-library/jest-dom',
    '^react/jsx-runtime$': '<rootDir>/node_modules/react/jsx-runtime.js',
    '^react/jsx-dev-runtime$': '<rootDir>/node_modules/react/jsx-dev-runtime.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: './tsconfig.json',
      useESM: true,
    }],
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!axios|nanoid|uuid|@tanstack|@testing-library)/'
  ],
  setupFilesAfterEnv: ['<rootDir>/../tests/web/setupTests.ts'],
};
