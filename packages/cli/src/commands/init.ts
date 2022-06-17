import { Flags } from '@oclif/core';
import { OutputFlags } from '@oclif/core/lib/interfaces';
import { Memoize } from 'typescript-memoize';
import { kebabCase } from 'lodash';
import {
  PROVIDER, AWS_REGIONS, ServiceConstructor,
  ProjectConfiguration, ProviderChoice, ServiceTypeChoice, ServiceRegistry,
} from '@stackmate/engine';

import { CURRENT_DIRECTORY, DEFAULT_PROJECT_FILE } from '@stackmate/cli/constants';
import { parseCommaSeparatedString } from '@stackmate/cli/lib/helpers';
import BaseCommand from '@stackmate/cli/core/commands/base';
import ConfigurationFile from '@stackmate/cli/lib/configuration-file';

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
      parse: async (v: string) => parseCommaSeparatedString(v).join(','),
    }),
  };

  /**
   * @var {Object} flags the parsed flags
   */
  protected parsedFlags: OutputFlags<typeof InitCommand.flags>;

  serviceAttributes(provider: ProviderChoice, service: ServiceTypeChoice) {
    let serviceProvider: ProviderChoice = provider;
    const serviceProviders = ServiceRegistry.providers(service);

    if (!serviceProviders.includes(provider)) {
      ([serviceProvider] = serviceProviders);
    }

    const srv: ServiceConstructor = ServiceRegistry.get(serviceProvider, service);
    return srv.config();
  }

  @Memoize() get project(): Required<ProjectConfiguration> {
    const { name, provider, region, /* stages, services */ } = this.parsedFlags;
    // const [defaultStage, ...otherStages] = stages;

    return {
      name,
      provider,
      region,
      state: { provider },
      secrets: { provider },
      stages: [],
      //   {
      //     name: defaultStage,
      //     services: services.map(
      //       (service: ServiceTypeChoice) => this.serviceAttributes(provider, service),
      //     ),
      //   },
      //   ...otherStages.map((stg: string) => ({
      //     name: stg,
      //     copy: defaultStage,
      //   })),
      // ],
    };
  }

  async run(): Promise<any> {
    const projectFile = new ConfigurationFile(DEFAULT_PROJECT_FILE);
    this.log('Test', projectFile);
    // console.log({ projectFile });
    // console.log({ attrs: this.project });
  }
}

export default InitCommand;
