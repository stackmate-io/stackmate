import tsConfig from './tsconfig.json';
import { JestConfigWithTsJest, pathsToModuleNameMapper } from 'ts-jest';

const { compilerOptions: { paths } } = tsConfig;

const opts: JestConfigWithTsJest = {
  clearMocks: true,
  cacheDirectory: '<rootDir>/.jestcache',
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { 'tsconfig': 'tsconfig.json', 'diagnostics': true }] },
  modulePaths: ['<rootDir>/packages/cli', '<rootDir>/packages/engine'],
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>' }),
  moduleFileExtensions: ['ts', 'js'],
  verbose: true,
};

export default opts;
