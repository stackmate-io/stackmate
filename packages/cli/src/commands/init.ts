import { Flags } from '@oclif/core';

import { AWS_REGIONS, PROVIDER } from '@stackmate/engine';
import BaseCommand from '@stackmate/cli/core/commands/base';

class InitCommand extends BaseCommand {
  /**
   * @var {Array} args the command's arguments
   */
  static args = [
    ...BaseCommand.args,
  ];

  /**
   * @var {Object} flags the flags to use in the command
   */
  static flags = {
    ...BaseCommand.flags,
    with: Flags.string({
      char: 'w',
      default: '',
      multiple: true,
      required: true,
      parse: async (v: string) => BaseCommand.parseCommaSeparatedFlag(v),
    }),
    provider: Flags.string({
      char: 'p',
      default: PROVIDER.AWS,
    }),
    region: Flags.string({
      char: 'r',
      default: AWS_REGIONS.EU_CENTRAL_1,
    }),
    deploy: Flags.boolean({
      default: true,
    }),
    stages: Flags.string({
      char: 's',
      default: 'production',
      parse: async (v: string) => BaseCommand.parseCommaSeparatedFlag(v),
    }),
    format: Flags.string({
      char: 'f',
      options: ['yaml', 'json'],
      default: 'yaml',
    }),
  };

  async run(): Promise<any> {
    // console.log(this.parsedFlags);
  }
}

export default InitCommand;
