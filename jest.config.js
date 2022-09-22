/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { compilerOptions: { paths } } = require('./tsconfig');
const { pathsToModuleNameMapper } = require('ts-jest');

module.exports = {
  clearMocks: true,
  cacheDirectory: '<rootDir>/.jestcache',
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": ['ts-jest', { "tsconfig": "tsconfig.json", "diagnostics": true }],
  },
  roots: [
    "<rootDir>/packages/cli",
    "<rootDir>/packages/engine",
  ],
  modulePaths: [
    "<rootDir>/packages/cli",
    "<rootDir>/packages/engine",
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>' }),
  moduleFileExtensions: [
    "ts",
    "js"
  ],
  verbose: true,
};
