import { Command, Config, Interfaces } from '@oclif/core';
import { ArgInput, FlagInput } from '@oclif/core/lib/interfaces';

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

  /**
   * Initializes the commend
   */
  async init() {
    ({ flags: this.parsedFlags, args: this.parsedArgs } = await this.parse(this.ctor));
  }
}

type AbstractCommandConstructor = abstract new (argv: string[], config: Config) => BaseCommand;

export type BaseCommandClass = AbstractCommandConstructor & Omit<Interfaces.Command.Class, 'new'> & {
  args: ArgInput;
  flags: FlagInput;
};

export default BaseCommand;
