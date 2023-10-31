import tsConfig from './tsconfig.json';
import { JestConfigWithTsJest, pathsToModuleNameMapper } from 'ts-jest';

const { compilerOptions: { paths } } = tsConfig;

const opts: JestConfigWithTsJest = {
  clearMocks: true,
  cacheDirectory: '<rootDir>/.jestcache',
  preset: 'ts-jest',
  rootDir: './',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  testRegex: `tests/.*\\.test\\.ts$`,
  transform: { '^.+\\.ts$': ['ts-jest', { 'tsconfig': '<rootDir>/tsconfig.json', 'diagnostics': true }] },
  modulePaths: ['<rootDir>'],
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>' }),
  moduleFileExtensions: ['ts', 'js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  verbose: true,
};

export default opts;