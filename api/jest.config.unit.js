module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ["<rootDir>/build/"],
  // ignore .js files
  testRegex: '(/__tests__/.*|(\\.|/)(test))\\.[t]sx?$',
  setupFiles: ['./src/inversify.test.config.ts'],
  coverageReporters: ["lcov", "text"],
  coverageDirectory: "test-coverage",
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  }
};