import tsConfig from './tsconfig.json';
import { pathsToModuleNameMapper } from 'ts-jest';

const { compilerOptions: { paths } } = tsConfig;

export default {
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
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>' }),
  moduleFileExtensions: [
    "ts",
    "js"
  ],
  setupFilesAfterEnv: ['<rootDir>/packages/engine/tests/jest.setup.ts'],
  verbose: true,
};
