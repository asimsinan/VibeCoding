module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    "**/tests/**/*.test.ts",
    "**/tests/**/*.test.tsx",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/web/jest-setup.d.ts",
    "/tests/web/mockApiClient.ts",
    "/tests/web/setupTests.ts",
    "/tests/web/e2e/mockAxios.ts",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!uuid)/"
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
    "node_modules/uuid/": "ts-jest"
  },
  projects: [
    {
      displayName: 'backend',
      testMatch: [
        "**/tests/**/*.test.ts",
        "!**/tests/web/**/*.test.tsx",
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    },
    {
      displayName: 'frontend',
      testMatch: [
        "**/tests/web/**/*.test.tsx",
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ["<rootDir>/tests/web/setupTests.ts"],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/web/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          useESM: true,
          tsconfig: {
            jsx: 'react-jsx',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            moduleResolution: 'node',
            module: 'esnext',
            target: 'es2020',
            baseUrl: '.',
            paths: {
              '@/*': ['./web/src/*', './src/*']
            }
          }
        }],
        '^.+\\.(js|jsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            ['@babel/preset-react', { runtime: 'automatic' }],
            '@babel/preset-typescript',
          ],
        }],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(axios|nanoid|uuid|@tanstack|@testing-library)/)',
      ],
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
    }
  ]
};
