import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

const config: Config = {
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/out/', '/.next/'],
  coverageProvider: 'v8',
  coverageDirectory: '<rootDir>/test/coverage',
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/out/**',
    '!**/.next/**',
    '!**/config.ts',
    '!**/*.config.ts',
    '!**/styles/**',
    '!**/coverage/**',
  ],
  coverageReporters: ['text', 'html'],
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
