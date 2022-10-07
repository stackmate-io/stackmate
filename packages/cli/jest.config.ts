import { JestConfigWithTsJest } from 'ts-jest';

import config from '../../jest.config.base';

const opts: JestConfigWithTsJest = {
  ...config,
  rootDir: '../..',
  testRegex: `packages/cli/tests/.*\\.test\\.ts$`,
};

export default opts;
