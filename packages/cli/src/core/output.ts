import path from 'node:path';

import { ConfigurationFile, createDirectory, resolveRelativePath } from '@stackmate/cli/lib';

class OutputFile extends ConfigurationFile {
  /**
   * @var {String} stage the stage's name
   */
  readonly stage: string;

  /**
   * @var {String} dirname the directory that the output is stored
   */
  readonly dirname: string;

  /**
   * @constructor
   * @param {String} stage the stage's name
   * @param {String} dirname the directory to store the output to
   */
  constructor(stage: string, dirname: string) {
    const stagePath = resolveRelativePath(dirname);
    createDirectory(stagePath);

    const filename = path.join(stagePath, `${stage}.json`);
    super(filename);

    this.stage = stage;
    this.dirname = dirname;
  }
}

export default OutputFile;
