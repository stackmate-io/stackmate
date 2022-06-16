/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { compilerOptions: { paths } } = require('./tsconfig');
const { pathsToModuleNameMapper } = require('ts-jest');

module.exports = {
  clearMocks: true,
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
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>' }),
  moduleFileExtensions: [
    "ts",
    "js"
  ],
  setupFilesAfterEnv: ['./jest.setup.js'],
};
