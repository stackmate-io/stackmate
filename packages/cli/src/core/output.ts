import path from 'node:path';
import { OperationType } from '@stackmate/engine';

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
  constructor(stage: string, dirname: string, operation: OperationType) {
    const stagePath = resolveRelativePath(dirname, stage);
    createDirectory(stagePath);

    const filename = path.join(stagePath, `${operation}.json`);
    super(filename);

    this.stage = stage;
    this.dirname = dirname;
  }
}

export default OutputFile;
