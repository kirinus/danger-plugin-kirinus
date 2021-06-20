module.exports = {
  clearMocks: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  coverageReporters: process.env.GITHUB_ACTIONS
    ? ['lcovonly', 'text']
    : ['html', 'json-summary', 'lcov', 'text'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  moduleFileExtensions: ['js', 'json', 'node', 'ts'],
  preset: 'ts-jest',
  reporters: ['default'],
  rootDir: '.',
  testEnvironment: require.resolve('jest-environment-node'),
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['/node_modules/$'],
  verbose: false,
};
