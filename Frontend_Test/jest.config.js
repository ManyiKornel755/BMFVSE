module.exports = {
  testEnvironment: 'jsdom',

  coverageDirectory: 'coverage',

  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js'
  ],

  testMatch: [
    '**/*.test.js',
    '**/__tests__/**/*.js'
  ],

  verbose: true,

  clearMocks: true,

  resetMocks: true,

  restoreMocks: true,

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  testTimeout: 10000,

  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],

  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
