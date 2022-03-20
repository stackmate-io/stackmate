import { Command, Flags } from '@oclif/core';
import { ValidationError } from '@stackmate/engine';
import { OutputArgs, OutputFlags } from '@oclif/core/lib/interfaces';

import { formatValidationError } from '@stackmate/cli/lib/formatters/errors';

abstract class BaseCommand extends Command {
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
   * @var {ArgInput} arguments the arguments used in the command
   */
  protected parsedArgs: OutputArgs;

  /**
   * @var {Object} flags the parsed flags
   */
  protected parsedFlags: OutputFlags<typeof BaseCommand.flags>;

  /**
   * Initializes the commend
   */
  async init() {
    const { flags, args } = await this.parse(this.ctor);
    this.parsedFlags = flags;
    this.parsedArgs = args;
  }

  /**
   * Error handler for all commands executed
   *
   * @param {Error} err the error thrown
   * @returns {any}
   */
  async catch(err: Error & { exitCode?: number | undefined; }): Promise<any> {
    if (err instanceof ValidationError) {
      formatValidationError(err, this, { colors: this.parsedFlags.colors });
      this.exit(1);
    }

    return super.catch(err);
  }
}

export default BaseCommand;
