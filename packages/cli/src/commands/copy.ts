import { Flags } from '@oclif/core';
import { ArgInput, FlagInput } from '@oclif/core/lib/interfaces';

import BaseCommand from '@stackmate/cli/core/commands/base';

class StageCopyCommand extends BaseCommand {
  /**
   * @var {Array} args the command's arguments
   */
  static args: ArgInput = [
    ...BaseCommand.args,
    {
      name: 'source',
      description: 'The source stage to copy',
      required: true,
      parse: async (input: string) => (input || '').trim(),
    },
    {
      name: 'target',
      description: 'The target stage to copy',
      required: true,
      parse: async (input: string) => (input || '').trim(),
    },
  ];

  /**
   * @var {String} summary the command's short description
   */
  static summary = 'Copies a stage to anoyther.';

  /**
   * @var {Object} flags the flags to use in the command
   */
  static flags: FlagInput = {
    ...BaseCommand.flags,
    full: Flags.boolean({
      default: false,
      required: false,
    }),
  };

  async run(): Promise<any> {
  }
}

export default StageCopyCommand;
