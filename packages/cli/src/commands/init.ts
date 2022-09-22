import { kebabCase } from 'lodash';
import { Flags } from '@oclif/core';
import { OutputFlags } from '@oclif/core/lib/interfaces';
import { PROVIDER, DEFAULT_REGIONS, SERVICE_TYPE, ServiceTypeChoice } from '@stackmate/engine';

import BaseCommand from '@stackmate/cli/core/commands/base';
import { createProject, getRepository } from '@stackmate/cli/core/generator';
import { CURRENT_DIRECTORY, DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';
import { ConfigurationFile, parseCommaSeparatedString } from '@stackmate/cli/lib';

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
    name: Flags.string({
      char: 'n',
    }),
    services: Flags.string({
      char: 'w',
      default: '',
      required: true,
    }),
    provider: Flags.string({
      char: 'p',
      default: PROVIDER.AWS,
    }),
    region: Flags.string({
      char: 'r',
      default: DEFAULT_REGIONS[PROVIDER.AWS],
    }),
    state: Flags.string({
      default: PROVIDER.AWS,
    }),
    secrets: Flags.string({
      default: PROVIDER.AWS,
    }),
    deploy: Flags.boolean({
      default: true,
    }),
    stages: Flags.string({
      char: 's',
      default: 'production',
    }),
  };

  /**
   * @var {Object} flags the parsed flags
   */
  protected parsedFlags: OutputFlags<typeof InitCommand.flags>;

  async run(): Promise<any> {
    const { name, provider, region, secrets, state, stages, services } = this.parsedFlags;
    const projectName = kebabCase(name || getRepository() || CURRENT_DIRECTORY);

    const project = createProject({
      projectName,
      defaultProvider: provider,
      defaultRegion: region,
      secretsProvider: secrets,
      stateProvider: state,
      stageNames: parseCommaSeparatedString(stages),
      serviceTypes: parseCommaSeparatedString(services).filter(
        s => s in Object.values(SERVICE_TYPE),
      ) as ServiceTypeChoice[],
    });

    const projectFile = new ConfigurationFile(DEFAULT_PROJECT_FILE);
    projectFile.write(project);
  }
}

export default InitCommand;
