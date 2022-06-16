/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { join } = require('path');
const { compilerOptions: { paths } } = require('./tsconfig');
const { pathsToModuleNameMapper } = require('ts-jest');

module.exports = {
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    "ts-jest": {
      "tsconfig": "tsconfig.json",
      "diagnostics": true,
    },
  },
  transform: {
    "^.+\\.ts$": "ts-jest",
    "engine/.+\\.ts$": "ts-jest",
    "engine/.+\\.js$": "babel-jest",
  },
  moduleNameMapper: {
    ...pathsToModuleNameMapper(paths, { prefix: '<rootDir>' }),
    '^@stackmate/engine/(.*)$': join(__dirname, '..', 'engine', 'src', '$1'),
  },
  moduleFileExtensions: [
    "ts",
    "js"
  ],
  setupFilesAfterEnv: ['./jest.setup.js'],
};
