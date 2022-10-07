import { Command } from '@oclif/core';
import { ProjectConfiguration } from '@stackmate/engine';
import { ArgInput, FlagInput, OutputArgs } from '@oclif/core/lib/interfaces';

import { ConfigurationFile } from '@stackmate/cli/lib';
import { DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';

abstract class BaseCommand extends Command {
  /**
   * @var {Array} args the command's arguments
   */
  static args: ArgInput = [
    ...(Command.args || []),
  ];

  /**
   * @var {Object} flags the flags available for the command
   * @static
   */
  static flags: FlagInput = {};

  /**
   * @var {ArgInput} arguments the arguments used in the command
   */
  protected parsedArgs: OutputArgs;

  /**
   * @var {Object} flags the parsed flags
   */
  protected parsedFlags: FlagInput;

  /**
   * @returns {ProjectConfiguration} the project configuration to load from the file
   */
  get projectConfig(): ProjectConfiguration {
    return new ConfigurationFile(DEFAULT_PROJECT_FILE).read() as ProjectConfiguration;
  }

  /**
   * Initializes the commend
   */
  async init() {
    ({ flags: this.parsedFlags, args: this.parsedArgs } = await this.parse(this.ctor));
  }
}

export default BaseCommand;
