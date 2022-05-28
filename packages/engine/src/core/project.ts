import { has } from 'lodash';

import Registry from '@stackmate/engine/core/registry';
import Entity from '@stackmate/engine/lib/entity';
import { uniqueIdentifier } from '@stackmate/engine/lib/helpers';
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
    const servicesAttributes = [
      this.getStateServiceAttributes(),
      this.getVaultServiceAttributes(),
      ...cloudServices,
    ];

    // Instantiate the services
    const services = servicesAttributes.map((srv) => {
      const { provider = this.provider, region = this.region, type, ...attrs } = srv;
      return Registry.get(provider, type).factory({ ...attrs, region }, defaults);
    });

    // Append the provider services
    const providers = this.getProviderServices(services)
    services.push(...providers);

    return providers;
  }

  /**
   * @returns {BaseServices.State.Attributes} the attributes for the state service
   */
  protected getStateServiceAttributes(): BaseServices.State.Attributes {
    const { provider = this.provider, region = this.region, ...attrs } = this.state;
    return { ...attrs, provider, region };
  }

  /**
   * @returns {BaseServices.Vault.Attributes} the attributes for the vault service
   */
  protected getVaultServiceAttributes(): BaseServices.Vault.Attributes {
    const { provider = this.provider, region = this.region, ...attrs } = this.secrets;
    return { ...attrs, provider, region };
  }

  /**
   * @param {String} stage the stage to get the service attributes for
   * @param {String[]} without the service names to skip
   * @returns {BaseService.Attributes[]} the attributes for the cloud services
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

  /**
   * @returns {BaseServices.Provider.Type} the attributes for the provider services
   */
  protected getProviderServices(services: BaseService.Attributes[]): BaseService.Type[] {
    const regions: Map<ProviderChoice, Set<string>> = new Map();

    // Iterate the services and keep a mapping of provider => unique set of regions
    services.forEach(({ provider = this.provider, region = this.region }) => {
      const providerRegions = regions.get(provider) || new Set();
      providerRegions.add(region);
      regions.set(provider, providerRegions);
    });

    const providers: BaseService.Type[] = [];
    regions.forEach((providerRegions, provider) => {
      providerRegions.forEach((region) => {
        const providerService = Registry.get(provider, SERVICE_TYPE.PROVIDER).factory({
          region,
          name: uniqueIdentifier(`provider-${provider}`, { region }),
        });

        providers.push(providerService);
      })
    })

    return providers;
  }
}

export default Project;
