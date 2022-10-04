import path from 'path';
import { JestConfigWithTsJest } from 'ts-jest';

import config from '../../jest.config.base';

const dirName = path.basename(path.resolve(__dirname));

const opts: JestConfigWithTsJest = {
  ...config,
  rootDir: '../..',
  testRegex: `packages/${dirName}/tests/.*\\.test\\.ts$`,
};

export default opts;
