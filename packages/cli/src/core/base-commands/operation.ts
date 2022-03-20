import path from 'node:path';

import { Flags } from '@oclif/core';
import { kebabCase } from 'lodash';

import BaseCommand from '@stackmate/cli/core/base-commands/base';
import ConfigurationFile from '@stackmate/cli/lib/configuration-file';
import { DEFAULT_PROJECT_DIRECTORY, DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';
import { ProjectConfiguration } from '@stackmate/engine';
import { OutputArgs, OutputFlags } from '@oclif/core/lib/interfaces';

abstract class OperationCommand extends BaseCommand {
  /**
   * @var {Object} flags the flags to use in the command
   */
  static flags = {
    ...BaseCommand.flags,
    file: Flags.string({
      char: 'f',
      description: 'Which configuration file to use',
      required: false,
      default: DEFAULT_PROJECT_FILE,
    }),
    output: Flags.string({
      char: 'o',
      description: 'Where to store the generated output',
      required: false,
      default: DEFAULT_PROJECT_DIRECTORY,
    }),
  }

  /**
   * @var {Array} args the command's arguments
   */
  static args = [
    { name: 'stage', description: 'The stage to deploy', required: true },
  ];

  /**
   * @returns {Object} the operation's output
   */
  abstract get output(): object;

  /**
   * @var {Object} flags the parsed flags
   */
  protected parsedFlags: OutputFlags<typeof OperationCommand.flags>;

  /**
   * @var {ArgInput} arguments the arguments used in the command
   */
  protected parsedArgs: OutputArgs;

  /**
   * @var {String} stage the stage to operate
   */
  protected stage: string;

  /**
   * @var {String} outputFilename the filename to store the output to
   */
  readonly outputFilename: string = 'stackmate.tf.json';

  /**
   * @returns {ProjectConfiguration} the project configuration to load from the file
   */
  get projectConfig(): ProjectConfiguration {
    const { file: filename } = this.parsedFlags;
    return new ConfigurationFile(filename).read();
  }

  /**
   * @returns {String} the path to output the synthesized stack to
   */
  get outputPath(): string {
    const { output: outputPath } = this.parsedFlags;
    return path.join(outputPath, kebabCase(this.stage));
  }

  /**
   * @returns {ConfigurationFile} the file object to write the output by
   */
  get outputFile(): ConfigurationFile {
    return new ConfigurationFile(path.join(this.outputPath, this.outputFilename));
  }

  /**
   * Initializes the commend
   */
  async init() {
    await super.init();
    ({ stage: this.stage } = this.parsedArgs);
  }

  /**
   * Synthesizes the operation and writes out the output
   */
  async run(): Promise<void> {
    this.outputFile.write(this.output);
  }
}

export default OperationCommand;
