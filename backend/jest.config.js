/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  setupFiles: ['<rootDir>/test/setupEnv.js'],
  testMatch: ['**/*.test.js'],
  testTimeout: 15000,
};
