/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo/node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
