import { Flags } from '@oclif/core';
import { OutputFlags } from '@oclif/core/lib/interfaces';
import { Memoize } from 'typescript-memoize';
import { fromPairs, kebabCase } from 'lodash';
import {
  PROVIDER, SERVICE_TYPE, AWS_REGIONS, CloudServiceConstructor, Project, ProjectConfiguration,
  ProviderChoice, Registry, ServiceTypeChoice, StackmateProject,
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
    const serviceProviders = Registry.providers(service);

    if (!serviceProviders.includes(provider)) {
      ([serviceProvider] = serviceProviders);
    }

    const srv: CloudServiceConstructor = Registry.get(serviceProvider, service);
    return srv.defaults();
  }

  @Memoize() get project(): StackmateProject {
    const { name, provider, region, stages, state, secrets, services } = this.parsedFlags;
    const [defaultStage, ...otherStages] = stages;

    const config: Required<ProjectConfiguration> = {
      name,
      provider,
      region,
      state: this.serviceAttributes(state, SERVICE_TYPE.STATE),
      secrets: this.serviceAttributes(secrets, SERVICE_TYPE.VAULT),
      stages: {
        [defaultStage]: services.map(
          (service: ServiceTypeChoice) => this.serviceAttributes(provider, service),
        ),
        ...fromPairs(
          otherStages.map((stg: string) => ([stg, { from: defaultStage }])),
        ),
      },
    };

    const project = new Project();
    project.attributes = config;
    return project;
  }

  async run(): Promise<any> {
    try {
      this.project.validate();
    } catch(err) {
      console.log(require('util').inspect(err))
    }

    const projectFile = new ConfigurationFile(DEFAULT_PROJECT_FILE);
    projectFile.write(this.project.attributes);
  }
}

export default InitCommand;
