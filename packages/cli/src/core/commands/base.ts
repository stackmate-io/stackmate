import { Command } from '@oclif/core';
import { ProjectConfiguration, StageConfiguration } from '@stackmate/engine';
import { ArgInput, FlagInput } from '@oclif/core/lib/interfaces';

import { ConfigurationFile, StageNotFoundError } from '@stackmate/cli/lib';
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
  protected parsedArgs: { [name: string]: any };

  /**
   * @var {Object} flags the parsed flags
   */
  protected parsedFlags: { [name: string]: any };

  protected filename: string  = DEFAULT_PROJECT_FILE;

  /**
   * @var {ProjectConfiguration} config the configuration object
   */
  #config: ConfigurationFile;

  /**
   * @returns {ConfigurationFile} the configuration file associated with this command
   */
  get configFile(): ConfigurationFile {
    if (!this.#config) {
      this.#config = new ConfigurationFile(this.filename);
    }

    return this.#config;
  }

  /**
   * @returns {ProjectConfiguration} the project configuration to load from the file
   */
  get projectConfig(): ProjectConfiguration {
    this.assertConfigExists();
    return this.configFile.read() as ProjectConfiguration;
  }

  /**
   * Asserts that a configuration file exists
   */
  assertConfigExists() {
    if (this.configFile.exists) {
      return;
    }

    this.log('Stackmate configuration not found. Use the `init` command to create one');
    this.exit(1);
  }

  /**
   * @param {String} name the stage's name
   * @returns {StageConfiguration} the stage requested
   */
  stage(name: string): StageConfiguration<true> {
    const stage = this.projectConfig.stages?.find(stg => stg.name === name);

    if (!stage) {
      throw new StageNotFoundError(name);
    }

    return stage;
  }

  /**
   * Initializes the commend
   */
  async init() {
    ({ flags: this.parsedFlags, args: this.parsedArgs } = await this.parse(this.ctor));
  }
}

export default BaseCommand;
