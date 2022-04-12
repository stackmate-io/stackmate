import { join as joinPaths } from 'node:path';
import { Flags } from '@oclif/core';
import { kebabCase } from 'lodash';
import { OutputFlags } from '@oclif/core/lib/interfaces';

import BaseCommand from '@stackmate/cli/core/commands/base';
import { DEFAULT_OUTPUT_DIRECTORY, STACK_FILE_NAME } from '@stackmate/cli/constants';

abstract class OperationCommand extends BaseCommand {
  /**
   * @var {Array} args the command's arguments
   */
  static args = [
    ...BaseCommand.args,
    { name: 'stage', description: 'The stage to work with', required: true },
  ];

  /**
   * @var {Object} flags the parsed flags
   */
  protected parsedFlags: OutputFlags<typeof OperationCommand.flags>;

  /**
   * @var {Object} flags the flags to use in the command
   */
  static flags = {
    ...BaseCommand.flags,
    output: Flags.string({
      char: 'o',
      description: 'The directory to write the generated configuration to',
      required: true,
      default: DEFAULT_OUTPUT_DIRECTORY,
    }),
  };

  /**
   * @var {String} stage the stage to operate
   */
  protected stage: string;

  /**
   * @var {String} filename the file name for the generated Terraform configuration
   */
  public readonly filename: string = STACK_FILE_NAME;

  /**
   * Initializes the commend
   */
  async init() {
    await super.init();
    ({ stage: this.stage } = this.parsedArgs);
  }

  /**
   * @returns {String} the path to output the files to
   */
  get outputPath(): string {
    return joinPaths(this.parsedFlags.output, kebabCase(this.stage))
  }
}

export default OperationCommand;
