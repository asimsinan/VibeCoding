module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  roots: ['<rootDir>/web/src', '<rootDir>/tests/web'],
  testMatch: [
    '<rootDir>/tests/web/**/*.test.ts',
    '<rootDir>/tests/web/**/*.test.tsx',
    '<rootDir>/tests/web/**/*.spec.ts',
    '<rootDir>/tests/web/**/*.spec.tsx',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/web/src/$1',
    '^axios$': '<rootDir>/web/node_modules/axios',
    '^axios-mock-adapter$': '<rootDir>/web/node_modules/axios-mock-adapter',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './web/tsconfig.json',
      },
    ],
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!axios|nanoid|uuid)/'
  ],
};
