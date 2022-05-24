import { has } from 'lodash';

import Registry from '@stackmate/engine/core/registry';
import Entity from '@stackmate/engine/lib/entity';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  BaseServices,
  StagesConfiguration,
  CloudProviderChoice,
  Project as StackmateProject,
  BaseService,
  ProviderChoice,
} from '@stackmate/engine/types';

class Project extends Entity<StackmateProject.Attributes> implements StackmateProject.Type {
  /**
   * @var {String} name the project's name
   */
  name: string;

  /**
   * @var {String} provider the default cloud provider for the project
   */
  provider: CloudProviderChoice;

  /**
   * @var {String} region the default cloud region for the project
   */
  region: string;

  /**
   * @var {VaultConfiguration} secrets the vault configuration
   */
  secrets: BaseServices.Vault.Attributes;

  /**
   * @var {BaseServices} state the state configuration
   */
  state: BaseServices.State.Attributes;

  /**
   * @var {Object} stages the stages declarations
   */
  stages: StagesConfiguration;

  /**
   * @param {String} name the name of the stage in the project to return services for
   * @returns {Service[]}
   */
  stage(name: string): BaseService.Type[] {
    const cloudServices = this.getCloudServiceAttributes(name);
    const defaults = { projectName: this.name, stageName: name };

    return [
      this.getStateServiceAttributes(),
      this.getVaultServiceAttributes(),
      ...this.getProvidersAttributes(cloudServices),
      ...cloudServices,
    ].map((srv) => {
      const { provider = this.provider, region = this.region, type, ...attrs } = srv;
      return Registry.get(provider, type).factory({ ...attrs, region }, defaults);
    });
  }

  protected getStateServiceAttributes(): BaseService.Attributes {
    const { provider = this.provider, region = this.region, ...attrs } = this.state;
    return { ...attrs, provider, region };
  }

  protected getVaultServiceAttributes(): BaseService.Attributes {
    const { provider = this.provider, region = this.region, ...attrs } = this.secrets;
    return { ...attrs, provider, region };
  }

  protected getProvidersAttributes(services: BaseService.Attributes[]): BaseService.Attributes[] {
    const regions: Map<ProviderChoice, Set<string>> = new Map();

    // Iterate the services and keep a mapping of
    // provider => unique set of regions
    services.forEach(({ provider = this.provider, region = this.region }) => {
      const providerRegions = regions.get(provider) || new Set();
      providerRegions.add(region);
      regions.set(provider, providerRegions);
    });

    const providerAttributes: BaseService.Type[] = [];
    regions.forEach((providerRegions, provider) => {
      providerRegions.forEach((region) => {
        providerAttributes.push(
          Registry.get(provider, SERVICE_TYPE.PROVIDER).factory({ region }),
        );
      })
    })

    return providerAttributes;
  }

  /**
   *
   * @param {String} stage
   * @param {String[]} without
   * @returns {BaseService.Type[]}
   */
  protected getCloudServiceAttributes(stage: string, without: string[] = []): BaseService.Attributes[] {
    if (!has(this.stages, stage)) {
      throw new Error(`Stage ${stage} is not available in the project`);
    }

    const { copy: copyFrom = null, skip: skipServices = [], ...stageServices } = this.stages[stage];

    const services = [];

    if (copyFrom) {
      services.push(...this.getCloudServiceAttributes(copyFrom, skipServices));
    }

    services.push(...Object.values(stageServices).filter(srv => !without.includes(srv.name)));

    return services.map(srv => {
      const { provider = this.provider, region = this.region, type, ...attrs } = srv;
      return { ...attrs, region };
    });
  }
}

export default Project;
