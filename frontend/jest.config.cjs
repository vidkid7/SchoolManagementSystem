module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/types/**',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1',
    '^@components/(.*)': '<rootDir>/src/components/$1',
    '^@features/(.*)': '<rootDir>/src/features/$1',
    '^@hooks/(.*)': '<rootDir>/src/hooks/$1',
    '^@store/(.*)': '<rootDir>/src/store/$1',
    '^@utils/(.*)': '<rootDir>/src/utils/$1',
    '^@services/(.*)': '<rootDir>/src/services/$1',
    '^@types/(.*)': '<rootDir>/src/types/$1',
    '^config/api$': '<rootDir>/src/config/__mocks__/api.ts',
    '^services/apiClient$': '<rootDir>/src/services/__mocks__/apiClient.ts',
    '\\.(css|less|scss|sass)': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)'
  ]
};