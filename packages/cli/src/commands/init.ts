import { Flags } from '@oclif/core';
import { OutputFlags } from '@oclif/core/lib/interfaces';
import { Memoize } from 'typescript-memoize';
import { kebabCase } from 'lodash';
import { PROVIDER, DEFAULT_REGIONS, ProjectConfiguration, SERVICE_TYPE, ServiceTypeChoice } from '@stackmate/engine';

import BaseCommand from '@stackmate/cli/core/commands/base';
import ConfigurationFile from '@stackmate/cli/lib/configuration-file';
import { createProject, getRepository } from '@stackmate/cli/core/generator';
import { CURRENT_DIRECTORY, DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';
import { parseCommaSeparatedString } from '@stackmate/cli/lib/helpers';

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

  @Memoize() get projectName(): string {
    const { name } = this.parsedFlags;

    if (name) {
      return name;
    }

    const repository = getRepository();
    if (repository) {
      return kebabCase(repository)
    }

    return kebabCase(CURRENT_DIRECTORY);
  }

  @Memoize() get project(): ProjectConfiguration {
    const { provider, region, secrets, state, stages, services } = this.parsedFlags;

    return createProject({
      projectName: this.projectName,
      defaultProvider: provider,
      defaultRegion: region,
      secretsProvider: secrets,
      stateProvider: state,
      stageNames: parseCommaSeparatedString(stages),
      serviceTypes: parseCommaSeparatedString(services).filter(
        s => s in Object.values(SERVICE_TYPE),
      ) as ServiceTypeChoice[],
    });
  }

  async run(): Promise<any> {
    const projectFile = new ConfigurationFile(DEFAULT_PROJECT_FILE);
    projectFile.write(this.project);
  }
}

export default InitCommand;
