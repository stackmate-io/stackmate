import { Command, Flags } from '@oclif/core';
import { ProjectConfiguration } from '@stackmate/engine';
import { OutputArgs, OutputFlags } from '@oclif/core/lib/interfaces';

import { DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';
import ConfigurationFile from '@stackmate/cli/lib/configuration-file';

abstract class BaseCommand extends Command {
  /**
   * @var {Array} args the command's arguments
   */
  static args = [
    ...(Command.args || []),
  ];

  /**
   * @var {Object} flags the flags available for the command
   * @static
   */
  static flags = {
    colors: Flags.boolean({
      char: 'c',
      description: 'Whether to use colors in the output',
      default: true,
    }),
  }

  /**
   * Parses a comma separated value
   *
   * @param {String} value the value to parse
   * @returns {String[]} the parsed
   */
  static parseCommaSeparatedString(value: string) {
    return value.split(',').map(v => v.trim()).join(',');
  }

  /**
   * @var {ArgInput} arguments the arguments used in the command
   */
  protected parsedArgs: OutputArgs;

  /**
   * @var {Object} flags the parsed flags
   */
  protected parsedFlags: OutputFlags<typeof BaseCommand.flags>;

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

  /**
   * Error handler for all commands executed
   *
   * @param {Error} err the error thrown
   * @returns {any}
   */
  // async catch(err: Error & { exitCode?: number | undefined; }): Promise<any> {
  //   if (err instanceof ValidationError) {
  //     formatValidationError(err, this, { colors: this.parsedFlags.colors });
  //     this.exit(1);
  //   }

  //   return super.catch(err);
  // }
}

export default BaseCommand;
