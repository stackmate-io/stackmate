import { Flags } from '@oclif/core';
import { kebabCase } from 'lodash';

import { AWS_REGIONS, PROVIDER } from '@stackmate/engine';
import { CURRENT_DIRECTORY } from '@stackmate/cli/constants';
import BaseCommand from '@stackmate/cli/core/commands/base';
import ProjectTemplate from '../core/template';
import { OutputFlags } from '@oclif/core/lib/interfaces';
import { parseCommaSeparatedString } from '../lib/helpers';

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
    services: Flags.string({
      char: 'w',
      name: 'with',
      default: '',
      multiple: true,
      required: true,
      parse: async (v: string) => parseCommaSeparatedString(v).join(','),
    }),
    name: Flags.string({
      char: 'n',
      default: kebabCase(CURRENT_DIRECTORY),
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
      parse: async (v: string) => parseCommaSeparatedString(v).join(','),
    }),
    format: Flags.string({
      char: 'f',
      options: ['yaml', 'json'],
      default: 'yaml',
    }),
  };

  /**
   * @var {Object} flags the parsed flags
   */
  protected parsedFlags: OutputFlags<typeof InitCommand.flags>;

  async run(): Promise<any> {
    const { name, provider, region, stages, services } = this.parsedFlags;
    // stages: parseCommaSeparatedString(stages),
    // services: parseCommaSeparatedString(services),

    const template = new ProjectTemplate();
    // template.name = name;
    // template.
  }
}

export default InitCommand;
