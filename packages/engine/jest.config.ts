import { JestConfigWithTsJest } from 'ts-jest';

import config from '../../jest.config.base';

const opts: JestConfigWithTsJest = {
  ...config,
  rootDir: '../..',
  testRegex: `packages/engine/tests/.*\\.test\\.ts$`,
  setupFilesAfterEnv: ['<rootDir>/packages/engine/jest.setup.ts'],
};

export default opts;
