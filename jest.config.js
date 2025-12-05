module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "services/**/*.js",
    "startupTasks.js",
    "!**/node_modules/**",
    "!**/test/**",
    "!**/coverage/**",
    "!**/*.config.js",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: ["**/test/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
  moduleNameMapper: {
    "^@wc/common-service$": "<rootDir>/test/__mocks__/common-service.js",
    "^@fc/grip_bond_service$": "<rootDir>/test/__mocks__/grip-bond-service.js",
  },
  verbose: true,
  coverageReporters: ["text", "lcov", "html"],
};


