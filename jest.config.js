/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { compilerOptions: { paths } } = require('./tsconfig');
const { pathsToModuleNameMapper } = require('ts-jest');

const defaultConfig = {
  bail: true,
  clearMocks: true,
  cacheDirectory: '<rootDir>/.jestcache',
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    "ts-jest": {
      "tsconfig": "tsconfig.json",
      "diagnostics": true
    }
  },
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  roots: [
    "<rootDir>/packages/cli",
    "<rootDir>/packages/engine",
  ],
  modulePaths: [
    "<rootDir>/packages/cli",
    "<rootDir>/packages/engine",
  ],
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>' }),
  moduleFileExtensions: [
    "ts",
    "js"
  ],
};

module.exports = {
  projects: [
    {
      ...defaultConfig,
      displayName: 'engine',
      setupFilesAfterEnv: ['<rootDir>/packages/engine/jest.setup.js'],
    },
    {
      ...defaultConfig,
      displayName: 'cli',
    },
  ],
};
